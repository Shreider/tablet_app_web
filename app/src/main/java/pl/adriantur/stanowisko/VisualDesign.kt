package pl.adriantur.stanowisko

import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.*
import androidx.compose.foundation.shape.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.*
import androidx.compose.ui.graphics.*
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.platform.LocalResources
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.*
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.lifecycle.repeatOnLifecycle
import java.time.ZonedDateTime
import java.time.format.DateTimeFormatter
import java.util.Locale
import kotlinx.coroutines.delay

private val Midnight = Color(0xFF050E17)
private val Panel = Color(0xFF0C202D)
private val Cyan = Color(0xFF3BDBEA)
private val Muted = Color(0xFF9EB6C5)
val PermissionAttentionColor = Color(0xFFFF7585)

@Composable
fun WorkspaceNoticeText(notice: WorkspaceNotice, modifier: Modifier = Modifier) {
    val color =
        when (notice.kind) {
            NoticeKind.INFORMATION -> Muted
            NoticeKind.CONFIGURATION -> Color(0xFFFFCE83)
            NoticeKind.ERROR -> MaterialTheme.colorScheme.error
        }
    Text(
        notice.text,
        color = color,
        modifier =
            modifier.semantics {
                liveRegion =
                    if (notice.kind == NoticeKind.ERROR) LiveRegionMode.Assertive
                    else LiveRegionMode.Polite
            },
        style = MaterialTheme.typography.bodyMedium,
    )
}

@Composable
private fun WorkspaceClock(modifier: Modifier = Modifier, compact: Boolean = false) {
    val lifecycleOwner = LocalLifecycleOwner.current
    val now by
        produceState(ZonedDateTime.now(), lifecycleOwner) {
            lifecycleOwner.lifecycle.repeatOnLifecycle(Lifecycle.State.RESUMED) {
                while (true) {
                    value = ZonedDateTime.now()
                    delay(1000)
                }
            }
        }
    val timeFormat = remember {
        DateTimeFormatter.ofPattern("HH:mm:ss", Locale.forLanguageTag("pl-PL"))
    }
    val dateFormat = remember {
        DateTimeFormatter.ofPattern("dd.MM.yyyy", Locale.forLanguageTag("pl-PL"))
    }
    Column(modifier, verticalArrangement = Arrangement.spacedBy(2.dp)) {
        Text(
            now.format(timeFormat),
            color = Cyan,
            fontFamily = FontFamily.Monospace,
            fontSize = if (compact) 16.sp else 20.sp,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
        )
        Text(now.format(dateFormat), color = Muted, style = MaterialTheme.typography.bodySmall)
    }
}

@Composable
private fun WorkspaceBattery() {
    val resources = LocalResources.current
    val battery by rememberBatteryStatus()
    val percentage = battery.percentage?.let { "$it%" } ?: "—"
    val color =
        if ((battery.percentage ?: 100) <= 15 && !battery.charging) Color(0xFFFFCE83) else Cyan
    Column(
        Modifier.widthIn(min = 36.dp).semantics(mergeDescendants = true) {
            contentDescription =
                resources.getString(
                    if (battery.charging) R.string.battery_charging else R.string.battery_level,
                    percentage,
                )
        },
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(4.dp),
    ) {
        Canvas(Modifier.size(24.dp, 14.dp)) {
            val inset = 1.dp.toPx()
            val terminal = 3.dp.toPx()
            val bodyWidth = size.width - terminal - inset
            drawRoundRect(
                color,
                Offset(inset, inset),
                Size(bodyWidth - inset, size.height - 2 * inset),
                CornerRadius(2.dp.toPx()),
                style = Stroke(inset),
            )
            drawLine(
                color,
                Offset(size.width - inset, size.height * .35f),
                Offset(size.width - inset, size.height * .65f),
                strokeWidth = inset * 2,
            )
            val fill = (battery.percentage ?: 0) / 100f
            if (fill > 0)
                drawRect(
                    color.copy(alpha = .6f),
                    Offset(inset * 3, inset * 3),
                    Size((bodyWidth - inset * 4) * fill, size.height - inset * 6),
                )
            if (battery.charging) {
                val x = bodyWidth / 2
                val bolt =
                    Path().apply {
                        moveTo(x + inset, inset)
                        lineTo(x - 2 * inset, size.height / 2)
                        lineTo(x + inset, size.height / 2)
                        lineTo(x - inset, size.height - inset)
                    }
                drawPath(bolt, Color.White, style = Stroke(inset * 1.5f))
            }
        }
        Text(percentage, color = color, style = MaterialTheme.typography.labelMedium, maxLines = 1)
    }
}

fun Modifier.permissionAttention(enabled: Boolean): Modifier =
    if (!enabled) this
    else
        drawBehind {
            val radius = CornerRadius(20.dp.toPx())
            for ((width, opacity) in listOf(16f to .025f, 12f to .04f, 8f to .065f, 4f to .10f)) {
                drawRoundRect(
                    PermissionAttentionColor.copy(alpha = opacity),
                    cornerRadius = radius,
                    style = Stroke(width.dp.toPx()),
                )
            }
        }

@Composable
fun WorkspaceTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme =
            darkColorScheme(
                primary = Cyan,
                onPrimary = Midnight,
                secondary = Color(0xFF82CEDB),
                background = Midnight,
                surface = Midnight,
                onBackground = Color(0xFFE4F2F7),
                onSurface = Color(0xFFE4F2F7),
                onSurfaceVariant = Muted,
                surfaceVariant = Panel,
                surfaceContainer = Panel,
                surfaceContainerHigh = Color(0xFF142D3B),
                outline = Color(0xFF315362),
                outlineVariant = Color(0xFF1C3A49),
                error = Color(0xFFFFB4AB),
            ),
        shapes =
            Shapes(
                small = RoundedCornerShape(12.dp),
                medium = RoundedCornerShape(20.dp),
                large = RoundedCornerShape(28.dp),
            ),
        content = content,
    )
}

@Composable
fun WorkspaceBackdrop(content: @Composable BoxScope.() -> Unit) {
    CompositionLocalProvider(LocalContentColor provides MaterialTheme.colorScheme.onBackground) {
        Box(
            Modifier.fillMaxSize()
                .background(
                    Brush.linearGradient(listOf(Color(0xFF102C3B), Midnight, Color(0xFF081925)))
                ),
            content = content,
        )
    }
}

@Composable
private fun WorkspaceGlyph(kind: String, modifier: Modifier = Modifier) {
    Canvas(modifier) {
        val unit = size.minDimension / 64f
        val stroke = Stroke(3f * unit, cap = StrokeCap.Round, join = StrokeJoin.Round)
        fun rect(x: Float, y: Float, w: Float, h: Float, radius: Float = 5f) =
            drawRoundRect(
                Cyan,
                Offset(x * unit, y * unit),
                Size(w * unit, h * unit),
                CornerRadius(radius * unit),
                style = stroke,
            )
        when {
            kind == "web" -> {
                drawCircle(Cyan, 24f * unit, Offset(32f * unit, 32f * unit), style = stroke)
                drawOval(
                    Cyan,
                    Offset(20f * unit, 8f * unit),
                    Size(24f * unit, 48f * unit),
                    style = stroke,
                )
                drawLine(
                    Cyan,
                    Offset(8f * unit, 32f * unit),
                    Offset(56f * unit, 32f * unit),
                    3f * unit,
                )
                drawLine(
                    Cyan,
                    Offset(12f * unit, 20f * unit),
                    Offset(52f * unit, 20f * unit),
                    2f * unit,
                )
                drawLine(
                    Cyan,
                    Offset(12f * unit, 44f * unit),
                    Offset(52f * unit, 44f * unit),
                    2f * unit,
                )
            }
            kind.contains("camera") -> {
                rect(7f, 18f, 50f, 34f, 8f)
                rect(23f, 12f, 18f, 6f, 2f)
                drawCircle(Cyan, 10f * unit, Offset(32f * unit, 35f * unit), style = stroke)
                drawCircle(Cyan, 2f * unit, Offset(49f * unit, 26f * unit))
            }
            kind.contains("clock") -> {
                drawCircle(Cyan, 23f * unit, Offset(32f * unit, 32f * unit), style = stroke)
                drawLine(
                    Cyan,
                    Offset(32f * unit, 17f * unit),
                    Offset(32f * unit, 33f * unit),
                    3f * unit,
                    StrokeCap.Round,
                )
                drawLine(
                    Cyan,
                    Offset(32f * unit, 33f * unit),
                    Offset(43f * unit, 39f * unit),
                    3f * unit,
                    StrokeCap.Round,
                )
            }
            kind.contains("contacts") || kind == "admin" -> {
                drawCircle(Cyan, 10f * unit, Offset(32f * unit, 19f * unit))
                val path =
                    Path().apply {
                        moveTo(14f * unit, 54f * unit)
                        lineTo(14f * unit, 47f * unit)
                        cubicTo(
                            14f * unit,
                            26f * unit,
                            50f * unit,
                            26f * unit,
                            50f * unit,
                            47f * unit,
                        )
                        lineTo(50f * unit, 54f * unit)
                        close()
                    }
                drawPath(path, Cyan)
            }
            kind == "lock" -> {
                rect(14f, 28f, 36f, 28f)
                drawArc(
                    Cyan,
                    180f,
                    180f,
                    false,
                    Offset(22f * unit, 8f * unit),
                    Size(20f * unit, 36f * unit),
                    style = stroke,
                )
                drawCircle(Cyan, 3f * unit, Offset(32f * unit, 40f * unit))
            }
            else ->
                for (x in listOf(10f, 35f)) for (y in listOf(10f, 35f)) {
                    drawRoundRect(
                        Brush.linearGradient(listOf(Color(0xFF72E8F1), Color(0xFF00BCD4))),
                        Offset(x * unit, y * unit),
                        Size(19f * unit, 19f * unit),
                        CornerRadius(5f * unit),
                    )
                }
        }
    }
}

@Composable
fun WorkspaceLauncher(
    rules: List<AppRule>,
    apps: List<InstalledApp>,
    protected: Boolean,
    busy: Boolean,
    message: WorkspaceNotice?,
    web: WebPageConfig,
    launchWeb: () -> Unit,
    launch: (String) -> Unit,
    admin: () -> Unit,
) {
    val resources = LocalResources.current
    WorkspaceBackdrop {
        BoxWithConstraints(Modifier.fillMaxSize().safeDrawingPadding()) {
            val wide = maxWidth >= 600.dp
            val showAdminLabel = maxWidth >= 420.dp
            val compact = maxHeight < 500.dp
            val spacious = wide && !compact
            val columns =
                if (wide) (maxWidth.value.toInt() / if (compact) 180 else 240).coerceIn(2, 4) else 2
            Column(
                Modifier.fillMaxSize()
                    .padding(
                        horizontal = if (spacious) 48.dp else 24.dp,
                        vertical = if (compact) 10.dp else 20.dp,
                    ),
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                Row(
                    Modifier.fillMaxWidth().widthIn(max = 1100.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Column(Modifier.weight(1f)) {
                        Text(
                            resources.getString(R.string.workspace_brand),
                            color = Cyan,
                            style = MaterialTheme.typography.labelMedium,
                            letterSpacing = 3.sp,
                        )
                        Text(
                            resources.getString(R.string.workspace_desktop),
                            style =
                                if (spacious) MaterialTheme.typography.headlineLarge
                                else MaterialTheme.typography.headlineSmall,
                            fontWeight = FontWeight.Light,
                        )
                    }
                    Box(
                        Modifier.padding(start = 12.dp)
                            .size(9.dp)
                            .background(if (protected) Cyan else Color(0xFFFFCE83), CircleShape)
                    )
                }
                Text(
                    if (protected) resources.getString(R.string.protection_active)
                    else resources.getString(R.string.protection_inactive),
                    Modifier.fillMaxWidth().padding(top = 8.dp),
                    style = MaterialTheme.typography.bodySmall,
                    color = if (protected) Muted else Color(0xFFFFCE83),
                )
                message?.let { WorkspaceNoticeText(it, Modifier.padding(top = 12.dp)) }
                if (busy) LinearProgressIndicator(Modifier.fillMaxWidth().padding(top = 12.dp))
                Box(
                    Modifier.weight(1f).widthIn(max = 1100.dp).fillMaxWidth(),
                    contentAlignment = Alignment.Center,
                ) {
                    if (rules.isEmpty() && !web.enabled)
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            WorkspaceGlyph("grid", Modifier.size(80.dp))
                            Spacer(Modifier.height(24.dp))
                            Text(
                                resources.getString(R.string.empty_workspace_title),
                                style = MaterialTheme.typography.headlineSmall,
                            )
                            Text(
                                resources.getString(R.string.empty_workspace_help),
                                Modifier.padding(top = 12.dp),
                                color = Muted,
                                textAlign = TextAlign.Center,
                            )
                        }
                    else {
                        LazyVerticalGrid(
                            GridCells.Fixed(columns),
                            Modifier.fillMaxWidth(),
                            horizontalArrangement =
                                Arrangement.spacedBy(if (wide) 24.dp else 14.dp),
                            verticalArrangement = Arrangement.spacedBy(20.dp),
                            contentPadding =
                                PaddingValues(vertical = if (compact) 12.dp else 28.dp),
                        ) {
                            if (web.enabled)
                                item(key = "workspace-web") {
                                    Surface(
                                        onClick = launchWeb,
                                        enabled = protected && !busy,
                                        shape = RoundedCornerShape(if (spacious) 30.dp else 24.dp),
                                        color = Color.Transparent,
                                        border = BorderStroke(1.dp, Color(0xFF244A5C)),
                                    ) {
                                        Column(
                                            Modifier.background(
                                                    Brush.linearGradient(
                                                        listOf(Color(0xFF143140), Color(0xFF081925))
                                                    )
                                                )
                                                .heightIn(
                                                    min =
                                                        if (compact) 136.dp
                                                        else if (wide) 216.dp else 174.dp
                                                )
                                                .padding(16.dp),
                                            horizontalAlignment = Alignment.CenterHorizontally,
                                            verticalArrangement = Arrangement.Center,
                                        ) {
                                            WorkspaceGlyph(
                                                "web",
                                                Modifier.size(
                                                    if (compact) 40.dp
                                                    else if (wide) 72.dp else 56.dp
                                                ),
                                            )
                                            Spacer(Modifier.height(if (compact) 10.dp else 20.dp))
                                            Text(
                                                web.title,
                                                style = MaterialTheme.typography.titleMedium,
                                                textAlign = TextAlign.Center,
                                                maxLines = 2,
                                                overflow = TextOverflow.Ellipsis,
                                            )
                                            Text(
                                                if (!protected)
                                                    resources.getString(
                                                        R.string.protection_required
                                                    )
                                                else if (web.singleSession)
                                                    resources.getString(R.string.mode_single)
                                                else resources.getString(R.string.mode_multiple),
                                                modifier = Modifier.padding(top = 6.dp),
                                                color = Muted,
                                                style = MaterialTheme.typography.labelSmall,
                                                textAlign = TextAlign.Center,
                                            )
                                        }
                                    }
                                }
                            items(rules, key = { it.packageName }) { rule ->
                                val installed = apps.find { it.packageName == rule.packageName }
                                Surface(
                                    onClick = { launch(rule.packageName) },
                                    enabled = installed != null && !busy,
                                    shape = RoundedCornerShape(if (spacious) 30.dp else 24.dp),
                                    color = Color.Transparent,
                                    border = BorderStroke(1.dp, Color(0xFF244A5C)),
                                ) {
                                    Column(
                                        Modifier.background(
                                                Brush.linearGradient(
                                                    listOf(Color(0xFF143140), Color(0xFF081925))
                                                )
                                            )
                                            .heightIn(
                                                min =
                                                    if (compact) 136.dp
                                                    else if (wide) 216.dp else 174.dp
                                            )
                                            .padding(16.dp),
                                        horizontalAlignment = Alignment.CenterHorizontally,
                                        verticalArrangement = Arrangement.Center,
                                    ) {
                                        WorkspaceGlyph(
                                            rule.packageName,
                                            Modifier.size(
                                                if (compact) 40.dp else if (wide) 72.dp else 56.dp
                                            ),
                                        )
                                        Spacer(Modifier.height(if (compact) 10.dp else 20.dp))
                                        Text(
                                            installed?.label
                                                ?: resources.getString(
                                                    R.string.application_unavailable
                                                ),
                                            style = MaterialTheme.typography.titleMedium,
                                            textAlign = TextAlign.Center,
                                            maxLines = 2,
                                            overflow = TextOverflow.Ellipsis,
                                        )
                                        Text(
                                            if (rule.singleSession)
                                                resources.getString(R.string.mode_single)
                                            else resources.getString(R.string.mode_multiple),
                                            modifier = Modifier.padding(top = 6.dp),
                                            color = Muted,
                                            style = MaterialTheme.typography.labelSmall,
                                            textAlign = TextAlign.Center,
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
                HorizontalDivider(color = Color(0xFF193341))
                Row(
                    Modifier.fillMaxWidth().padding(top = 12.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween,
                ) {
                    WorkspaceBattery()
                    Spacer(Modifier.width(if (wide) 20.dp else 12.dp))
                    WorkspaceClock(Modifier.weight(1f).padding(end = 12.dp), compact = !wide)
                    OutlinedButton(
                        onClick = admin,
                        modifier =
                            Modifier.semantics {
                                contentDescription =
                                    resources.getString(R.string.administrator_panel)
                            },
                        border = BorderStroke(1.dp, Color(0xFF315362)),
                        contentPadding = PaddingValues(horizontal = 14.dp, vertical = 12.dp),
                    ) {
                        WorkspaceGlyph("admin", Modifier.size(18.dp))
                        if (showAdminLabel) {
                            Spacer(Modifier.width(8.dp))
                            Text(
                                resources.getString(R.string.administrator_panel),
                                style = MaterialTheme.typography.labelMedium,
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun AuthEmblem() {
    Surface(
        shape = CircleShape,
        color = Color(0xFF0C2432),
        border = BorderStroke(1.dp, Color(0xFF285569)),
    ) {
        WorkspaceGlyph("lock", Modifier.padding(20.dp).size(48.dp))
    }
}
