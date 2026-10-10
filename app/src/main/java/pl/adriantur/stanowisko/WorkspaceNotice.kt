package pl.adriantur.stanowisko

enum class NoticeKind {
    INFORMATION,
    CONFIGURATION,
    ERROR,
}

data class WorkspaceNotice(val text: String, val kind: NoticeKind) {
    val expires
        get() = kind == NoticeKind.INFORMATION
}
