import httpx
from pydantic import ValidationError

from app.core.exceptions import (
    GitHubAPIError,
    InvalidGitHubResponseError,
)
from app.schemas.github import (
    GitHubCommit,
    GitHubJob,
    GitHubPullRequest,
    GitHubRepository,
    GitHubWorkflowRun,
)


class GitHubService:

    BASE_URL = "https://api.github.com"

    async def _get(
        self,
        endpoint: str,
        token: str = None,
    ) -> dict | list:

        if not endpoint.startswith("http"):
            url = f"{self.BASE_URL}{endpoint}"
        else:
            url = endpoint

        headers = {
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
        }
        if token:
            headers["Authorization"] = f"Bearer {token}"

        async with httpx.AsyncClient(
            timeout=10.0,
            follow_redirects=True,
        ) as client:

            try:
                response = await client.get(
                    url,
                    headers=headers,
                )
            except httpx.RequestError as exc:
                raise GitHubAPIError() from exc

            if response.status_code == 401:
                raise GitHubAPIError("Invalid or expired GitHub token")
            elif response.status_code in (403, 404):
                raise GitHubAPIError("Repository inaccessible or not found")

            try:
                response.raise_for_status()
            except httpx.HTTPStatusError as exc:
                raise GitHubAPIError() from exc

            try:
                return response.json()
            except ValueError as exc:
                raise InvalidGitHubResponseError() from exc

    async def _get_paginated(
        self,
        endpoint: str,
        token: str,
        limit: int,
        data_key: str = None,
    ) -> list:
        results = []
        page = 1
        per_page = min(limit, 100)
        
        separator = "&" if "?" in endpoint else "?"
        
        while len(results) < limit:
            url = f"{endpoint}{separator}per_page={per_page}&page={page}"
            data = await self._get(url, token=token)
            
            items = data.get(data_key, []) if data_key else data
            if not items:
                break
                
            results.extend(items)
            if len(items) < per_page:
                break
                
            page += 1
            
        return results[:limit]

    async def get_repository(
        self,
        owner: str,
        repo: str,
        token: str = None,
    ) -> GitHubRepository:

        data = await self._get(
            f"/repos/{owner}/{repo}",
            token=token,
        )

        try:
            return GitHubRepository(
                owner=data["owner"]["login"],
                name=data["name"],
                full_name=data["full_name"],
                description=data.get("description"),
                url=data["html_url"],
                default_branch=data["default_branch"],
                stars=data["stargazers_count"],
                forks=data["forks_count"],
                open_issues=data["open_issues_count"],
            )
        except (KeyError, TypeError, ValidationError) as exc:
            raise InvalidGitHubResponseError() from exc

    async def get_commits(
        self,
        owner: str,
        repo: str,
        limit: int = 10,
        token: str = None,
    ) -> list[GitHubCommit]:

        data = await self._get_paginated(
            f"/repos/{owner}/{repo}/commits",
            token=token,
            limit=limit,
        )

        try:
            return [
                GitHubCommit(
                    sha=commit["sha"],
                    message=commit["commit"]["message"],
                    author=(
                        commit["author"]["login"]
                        if commit.get("author")
                        else commit["commit"]["author"]["name"]
                    ),
                    date=commit["commit"]["author"]["date"],
                    url=commit["html_url"],
                )
                for commit in data
            ]
        except (KeyError, TypeError, ValidationError) as exc:
            raise InvalidGitHubResponseError() from exc

    async def get_pull_requests(
        self,
        owner: str,
        repo: str,
        limit: int = 10,
        token: str = None,
    ) -> list[GitHubPullRequest]:

        data = await self._get_paginated(
            f"/repos/{owner}/{repo}/pulls?state=all",
            token=token,
            limit=limit,
        )

        results = []

        try:
            for pull_request in data:

                merged = (
                    pull_request.get("merged_at") is not None
                )

                results.append(
                    GitHubPullRequest(
                        number=pull_request["number"],
                        title=pull_request["title"],
                        state=pull_request["state"],
                        author=(
                            pull_request["user"]["login"]
                            if pull_request.get("user")
                            else None
                        ),
                        created_at=pull_request["created_at"],
                        updated_at=pull_request["updated_at"],
                        merged=merged,
                        url=pull_request["html_url"],
                    )
                )
        except (KeyError, TypeError, ValidationError) as exc:
            raise InvalidGitHubResponseError() from exc

        return results

    async def get_workflow_runs(
        self,
        owner: str,
        repo: str,
        limit: int = 10,
        token: str = None,
    ) -> list[GitHubWorkflowRun]:

        data = await self._get_paginated(
            f"/repos/{owner}/{repo}/actions/runs",
            token=token,
            limit=limit,
            data_key="workflow_runs",
        )

        try:
            return [
                GitHubWorkflowRun(
                    id=run["id"],
                    workflow_name=run["name"],
                    branch=run["head_branch"] or "",
                    commit_sha=run.get("head_sha"),
                    status=run["status"],
                    conclusion=run.get("conclusion"),
                    started_at=run["run_started_at"],
                    completed_at=run.get("updated_at"),
                    url=run["html_url"],
                )
                for run in data
            ]
        except (KeyError, TypeError, ValidationError) as exc:
            raise InvalidGitHubResponseError() from exc

    async def get_jobs(
        self,
        owner: str,
        repo: str,
        run_id: int,
        token: str = None,
    ) -> list[GitHubJob]:

        data = await self._get_paginated(
            f"/repos/{owner}/{repo}/actions/runs/{run_id}/jobs",
            token=token,
            limit=100,
            data_key="jobs",
        )

        try:
            return [
                GitHubJob(
                    id=job["id"],
                    name=job["name"],
                    status=job["status"],
                    conclusion=job.get("conclusion"),
                    started_at=job.get("started_at"),
                    completed_at=job.get("completed_at"),
                    url=job["html_url"],
                )
                for job in data
            ]
        except (KeyError, TypeError, ValidationError) as exc:
            raise InvalidGitHubResponseError() from exc


github_service = GitHubService()
