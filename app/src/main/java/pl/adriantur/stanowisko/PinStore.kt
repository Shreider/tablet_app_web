package pl.adriantur.stanowisko

import android.content.Context
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.util.Base64
import java.security.KeyStore
import java.security.MessageDigest
import java.security.SecureRandom
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext

class PinStore(private val context: Context) {
    companion object {
        const val DEFAULT_PIN = "1111"
    }

    private val prefs = context.getSharedPreferences("auth", Context.MODE_PRIVATE)
    private val mutex = Mutex()
    val configured
        get() = prefs.contains("credential")

    private fun key(): SecretKey {
        val store = KeyStore.getInstance("AndroidKeyStore").apply { load(null) }
        return (store.getKey("workspace.pin", null) as? SecretKey)
            ?: KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore")
                .apply {
                    init(
                        KeyGenParameterSpec.Builder(
                                "workspace.pin",
                                KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT,
                            )
                            .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                            .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                            .build()
                    )
                }
                .generateKey()
    }

    private fun store(pin: String) {
        checkWorkspace(PinCrypto.valid(pin)) {
            context.getString(R.string.error_pin_format)
        }
        val salt = ByteArray(32).also { SecureRandom().nextBytes(it) }
        val hash = PinCrypto.derive(pin.toCharArray(), salt)
        val cipher =
            Cipher.getInstance("AES/GCM/NoPadding").apply { init(Cipher.ENCRYPT_MODE, key()) }
        val encrypted = cipher.doFinal(salt + hash)
        checkWorkspace(
            prefs
                .edit()
                .putString(
                    "credential",
                    Base64.encodeToString(cipher.iv + encrypted, Base64.NO_WRAP),
                )
                .putInt("failures", 0)
                .putLong("blockedUntil", 0)
                .commit()
        )
        hash.fill(0)
    }

    suspend fun initializeDefault() = mutex.withLock {
        withContext(Dispatchers.IO) {
            // Domyślny PIN ustawiamy tylko przy pierwszej instalacji, bez kodu awaryjnego.
            if (!configured) store(DEFAULT_PIN)
        }
    }

    suspend fun set(pin: String, allowReplace: Boolean = false) = mutex.withLock {
        withContext(Dispatchers.IO) {
            checkWorkspace(!configured || allowReplace)
            store(pin)
        }
    }

    suspend fun verify(pin: String): Boolean = mutex.withLock {
        withContext(Dispatchers.IO) {
            val now = System.currentTimeMillis()
            val until = prefs.getLong("blockedUntil", 0)
            checkWorkspace(now >= until) {
                context.getString(R.string.error_pin_wait, (until - now) / 1000 + 1)
            }
            checkWorkspace(configured) { context.getString(R.string.error_pin_not_configured) }
            val encoded = Base64.decode(prefs.getString("credential", null), Base64.NO_WRAP)
            val cipher =
                Cipher.getInstance("AES/GCM/NoPadding").apply {
                    init(
                        Cipher.DECRYPT_MODE,
                        key(),
                        GCMParameterSpec(128, encoded.copyOfRange(0, 12)),
                    )
                }
            val plain = cipher.doFinal(encoded.copyOfRange(12, encoded.size))
            val candidate = PinCrypto.derive(pin.toCharArray(), plain.copyOfRange(0, 32))
            val ok = MessageDigest.isEqual(candidate, plain.copyOfRange(32, 64))
            candidate.fill(0)
            plain.fill(0)
            val failures = if (ok) 0 else prefs.getInt("failures", 0) + 1
            checkWorkspace(
                prefs
                    .edit()
                    .putInt("failures", failures)
                    .putLong("blockedUntil", if (ok) 0 else now + PinCrypto.delayMillis(failures))
                    .commit()
            )
            ok
        }
    }
}
