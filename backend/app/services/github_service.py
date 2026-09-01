import httpx

from app.schemas.github import (
    GitHubCommit,
    GitHubPullRequest,
    GitHubRepository,
)


class GitHubService:

    BASE_URL = "https://api.github.com"

    async def _get(
        self,
        endpoint: str,
    ) -> dict | list:

        url = f"{self.BASE_URL}{endpoint}"

        async with httpx.AsyncClient(
            timeout=10.0,
            follow_redirects=True,
        ) as client:

            response = await client.get(
                url,
                headers={
                    "Accept": "application/vnd.github+json",
                    "X-GitHub-Api-Version": "2022-11-28",
                },
            )

            response.raise_for_status()

            return response.json()

    async def get_repository(
        self,
        owner: str,
        repo: str,
    ) -> GitHubRepository:

        data = await self._get(
            f"/repos/{owner}/{repo}"
        )

        return GitHubRepository(
            owner=data["owner"]["login"],
            name=data["name"],
            full_name=data["full_name"],
            description=data["description"],
            url=data["html_url"],
            default_branch=data["default_branch"],
            stars=data["stargazers_count"],
            forks=data["forks_count"],
            open_issues=data["open_issues_count"],
        )

    async def get_commits(
        self,
        owner: str,
        repo: str,
        limit: int = 10,
    ) -> list[GitHubCommit]:

        data = await self._get(
            f"/repos/{owner}/{repo}/commits"
            f"?per_page={limit}"
        )

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

    async def get_pull_requests(
        self,
        owner: str,
        repo: str,
        limit: int = 10,
    ) -> list[GitHubPullRequest]:

        data = await self._get(
            f"/repos/{owner}/{repo}/pulls"
            f"?state=all&per_page={limit}"
        )

        results = []

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

        return results


github_service = GitHubService()