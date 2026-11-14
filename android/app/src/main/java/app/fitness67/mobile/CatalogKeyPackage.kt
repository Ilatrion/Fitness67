package app.fitness67.mobile

import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.util.Base64
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.*
import com.facebook.react.uimanager.ViewManager
import java.security.KeyStore
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec

class CatalogKeyModule(private val ctx: ReactApplicationContext) : ReactContextBaseJavaModule(ctx) {
  override fun getName() = "CatalogKey"
  private val alias = "fitness67.catalog.v1"
  private val prefs get() = ctx.getSharedPreferences("fitness67_catalog_secure", 0)
  private fun key(): SecretKey {
    val store = KeyStore.getInstance("AndroidKeyStore").apply { load(null) }
    if (store.containsAlias(alias)) return store.getKey(alias, null) as SecretKey
    return KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore").apply {
      init(KeyGenParameterSpec.Builder(alias, KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT)
        .setBlockModes(KeyProperties.BLOCK_MODE_GCM).setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE).build())
    }.generateKey()
  }
  @ReactMethod fun save(value: String, promise: Promise) {
    try {
      val cipher = Cipher.getInstance("AES/GCM/NoPadding").apply { init(Cipher.ENCRYPT_MODE, key()) }
      val encrypted = cipher.doFinal(value.toByteArray(Charsets.UTF_8))
      if (!prefs.edit().putString("iv", Base64.encodeToString(cipher.iv, Base64.NO_WRAP))
        .putString("value", Base64.encodeToString(encrypted, Base64.NO_WRAP)).commit()) throw Exception()
      promise.resolve(null)
    } catch (e: Exception) { promise.reject("KEY_SAVE", "Не удалось сохранить ключ в защищенном хранилище") }
  }
  @ReactMethod fun read(promise: Promise) {
    try {
      val value = prefs.getString("value", null)
      if (value == null) { promise.resolve(null); return }
      val iv = Base64.decode(prefs.getString("iv", ""), Base64.NO_WRAP)
      val cipher = Cipher.getInstance("AES/GCM/NoPadding").apply { init(Cipher.DECRYPT_MODE, key(), GCMParameterSpec(128, iv)) }
      promise.resolve(String(cipher.doFinal(Base64.decode(value, Base64.NO_WRAP)), Charsets.UTF_8))
    } catch (e: Exception) { promise.reject("KEY_READ", "Не удалось прочитать ключ. Удалите его и сохраните заново") }
  }
  @ReactMethod fun remove(promise: Promise) {
    try {
      if (!prefs.edit().clear().commit()) throw Exception()
      KeyStore.getInstance("AndroidKeyStore").apply { load(null); deleteEntry(alias) }
      promise.resolve(null)
    } catch (e: Exception) { promise.reject("KEY_DELETE", "Не удалось удалить ключ") }
  }
}
class CatalogKeyPackage : ReactPackage {
  override fun createNativeModules(context: ReactApplicationContext): List<NativeModule> = listOf(CatalogKeyModule(context))
  override fun createViewManagers(context: ReactApplicationContext): List<ViewManager<*, *>> = emptyList()
}
