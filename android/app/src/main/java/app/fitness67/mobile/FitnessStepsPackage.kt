package app.fitness67.mobile
import android.content.Intent
import android.hardware.Sensor
import android.hardware.SensorManager
import android.os.Build
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.*
import com.facebook.react.uimanager.ViewManager
import java.text.SimpleDateFormat
import java.util.*
class FitnessStepsModule(private val ctx: ReactApplicationContext): ReactContextBaseJavaModule(ctx) {
 override fun getName()="FitnessSteps"
 private val prefs get()=ctx.getSharedPreferences("fitness67_steps",0)
 @ReactMethod fun status(p:Promise) {
  val today=SimpleDateFormat("yyyy-MM-dd",Locale.US).format(Date())
  val m=Arguments.createMap();m.putBoolean("available",(ctx.getSystemService("sensor") as SensorManager).getDefaultSensor(Sensor.TYPE_STEP_COUNTER)!=null)
  m.putBoolean("enabled",prefs.getBoolean("enabled",false) && FitnessStepService.running);m.putInt("steps",if(prefs.getString("date","")==today)prefs.getInt("steps",0)else 0);m.putInt("interval",prefs.getInt("interval",1000));m.putString("error",prefs.getString("error",""));p.resolve(m)
 }
 @ReactMethod fun start(interval:Double,p:Promise) {
  if(!interval.isFinite()||interval<100||interval>50000){p.reject("INTERVAL","Выберите интервал от 100 до 50 000 шагов");return}
  if((ctx.getSystemService("sensor") as SensorManager).getDefaultSensor(Sensor.TYPE_STEP_COUNTER)==null){p.reject("SENSOR","В телефоне нет доступного датчика шагов");return}
  val old=prefs.getInt("steps",0);val n=interval.toInt()
  prefs.edit().putInt("interval",n).putInt("notified",old/n).putString("error","").apply()
  try {val i=Intent(ctx,FitnessStepService::class.java);if(Build.VERSION.SDK_INT>=26)ctx.startForegroundService(i)else ctx.startService(i);p.resolve(null)}catch(e:Exception){p.reject("START","Не удалось включить шагомер. Проверьте разрешения")}
 }
 @ReactMethod fun stop(p:Promise) {prefs.edit().putBoolean("enabled",false).putBoolean("baseline",false).apply();ctx.stopService(Intent(ctx,FitnessStepService::class.java));p.resolve(null)}
}
class FitnessStepsPackage:ReactPackage {
 override fun createNativeModules(context:ReactApplicationContext):List<NativeModule> = listOf(FitnessStepsModule(context))
 override fun createViewManagers(context:ReactApplicationContext):List<ViewManager<*,*>> = emptyList()
}
