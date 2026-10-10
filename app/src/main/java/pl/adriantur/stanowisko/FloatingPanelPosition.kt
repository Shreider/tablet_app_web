package pl.adriantur.stanowisko

import kotlin.math.roundToInt

// Po obrocie ekran nadal musi mieścić całe pływające menu.
data class FloatingPanelBounds(val minX: Int, val minY: Int, val maxX: Int, val maxY: Int) {
    init {
        require(maxX >= minX && maxY >= minY)
    }

    fun clamp(x: Int, y: Int) = x.coerceIn(minX, maxX) to y.coerceIn(minY, maxY)

    fun position(x: Float, y: Float): Pair<Int, Int> {
        fun fraction(value: Float) = if (value.isFinite()) value.coerceIn(0f, 1f) else 1f
        return (minX + ((maxX - minX) * fraction(x)).roundToInt()) to
            (minY + ((maxY - minY) * fraction(y)).roundToInt())
    }

    fun fractions(x: Int, y: Int): Pair<Float, Float> {
        val (safeX, safeY) = clamp(x, y)
        return (if (maxX == minX) 0f else (safeX - minX).toFloat() / (maxX - minX)) to
            (if (maxY == minY) 0f else (safeY - minY).toFloat() / (maxY - minY))
    }
}
