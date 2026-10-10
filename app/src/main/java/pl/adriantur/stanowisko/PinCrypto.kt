package pl.adriantur.stanowisko

import javax.crypto.SecretKeyFactory
import javax.crypto.spec.PBEKeySpec

object PinCrypto {
    const val ITERATIONS = 600_000

    fun valid(pin: String) = pin.length in 4..12 && pin.all { it in '0'..'9' }

    fun derive(pin: CharArray, salt: ByteArray): ByteArray {
        val spec = PBEKeySpec(pin, salt, ITERATIONS, 256)
        return try {
            SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256").generateSecret(spec).encoded
        } finally {
            spec.clearPassword()
            pin.fill('\u0000')
        }
    }

    fun delayMillis(failures: Int): Long =
        if (failures < 5) 0
        else (30_000L * (1L shl (failures - 5).coerceAtMost(5))).coerceAtMost(900_000L)
}
