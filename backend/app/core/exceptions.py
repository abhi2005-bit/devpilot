class ProjectNotFoundError(Exception):
    pass


class IssueNotFoundError(Exception):
    pass


class PermissionDeniedError(Exception):
    pass


class UserNotFoundError(Exception):
    pass


class ProjectMemberNotFoundError(Exception):
    pass


class ProjectMemberAlreadyExistsError(Exception):
    pass