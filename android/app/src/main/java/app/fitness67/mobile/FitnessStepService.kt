package app.fitness67.mobile

import android.app.*
import android.content.*
import android.hardware.*
import android.os.*
import java.text.SimpleDateFormat
import java.util.*
import kotlin.math.floor

class FitnessStepService : Service(), SensorEventListener {
  companion object { @Volatile var running = false }
  private val prefs by lazy { getSharedPreferences("fitness67_steps", 0) }
  private val sensors by lazy { getSystemService(SENSOR_SERVICE) as SensorManager }
  private val handler = Handler(Looper.getMainLooper())
  private fun day() = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date())
  private val ticker = object : Runnable {
    override fun run() { resetDay(); updateNotification(); handler.postDelayed(this, 30000) }
  }
  private fun resetDay() {
    if (prefs.getString("date", "") != day()) prefs.edit().putString("date", day()).putInt("steps", 0).putInt("notified", 0).apply()
  }
  private fun notification(text: String): Notification {
    val launch = packageManager.getLaunchIntentForPackage(packageName)
    val pending = PendingIntent.getActivity(this, 0, launch, PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT)
    val stop = PendingIntent.getService(this, 1, Intent(this, FitnessStepService::class.java).setAction("STOP"), PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT)
    val b = if (Build.VERSION.SDK_INT >= 26) Notification.Builder(this,"fitness67_steps_active") else Notification.Builder(this)
    return b.setSmallIcon(android.R.drawable.ic_menu_mylocation).setContentTitle("Fitness67 · Шагомер").setContentText(text).setContentIntent(pending).setOngoing(true).addAction(android.R.drawable.ic_media_pause,"Остановить",stop).build()
  }
  private fun updateNotification() {
    (getSystemService(NOTIFICATION_SERVICE) as NotificationManager).notify(6701, notification("Сегодня с момента включения: ${prefs.getInt("steps",0)} шагов"))
  }
  override fun onCreate() {
    super.onCreate()
    val n = getSystemService(NOTIFICATION_SERVICE) as NotificationManager
    if (Build.VERSION.SDK_INT >= 26) {
      n.createNotificationChannel(NotificationChannel("fitness67_steps_active", "Работа шагомера", NotificationManager.IMPORTANCE_LOW))
      n.createNotificationChannel(NotificationChannel("fitness67_steps_goal", "Достижения по шагам", NotificationManager.IMPORTANCE_DEFAULT))
    }
  }
  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    if (intent?.action == "STOP") {prefs.edit().putBoolean("enabled",false).putBoolean("baseline",false).apply();stopSelf();return START_NOT_STICKY}
    try {
      resetDay()
      startForeground(6701, notification("Шагомер включен"))
      val sensor = sensors.getDefaultSensor(Sensor.TYPE_STEP_COUNTER)
      if (sensor == null) {prefs.edit().putBoolean("enabled",false).apply();stopSelf();return START_NOT_STICKY}
      sensors.unregisterListener(this)
      if(!sensors.registerListener(this,sensor,SensorManager.SENSOR_DELAY_NORMAL)) throw IllegalStateException()
      running = true
      prefs.edit().putBoolean("enabled",true).apply()
      handler.removeCallbacks(ticker);handler.post(ticker)
      return START_STICKY
    } catch(e:Exception) {prefs.edit().putBoolean("enabled",false).putString("error","Не удалось запустить датчик. Проверьте разрешение на физическую активность").apply();stopSelf();return START_NOT_STICKY}
  }
  override fun onSensorChanged(event: SensorEvent) {
    if(event.sensor.type != Sensor.TYPE_STEP_COUNTER)return
    resetDay()
    val current=floor(event.values[0].toDouble()).toLong()
    val last=prefs.getLong("last",current)
    val elapsed=SystemClock.elapsedRealtime()
    val rebooted=elapsed < prefs.getLong("elapsed",elapsed)
    val delta=if(!prefs.getBoolean("baseline",false)||rebooted||current<last)0L else current-last
    val steps=(prefs.getInt("steps",0).toLong()+delta).coerceIn(0,1000000).toInt()
    val every=prefs.getInt("interval",1000)
    val milestone=steps/every
    val old=prefs.getInt("notified",0)
    prefs.edit().putLong("last",current).putLong("elapsed",elapsed).putBoolean("baseline",true).putInt("steps",steps).putInt("notified",milestone).apply()
    updateNotification()
    if(milestone>old) {
      val b=if(Build.VERSION.SDK_INT>=26)Notification.Builder(this,"fitness67_steps_goal")else Notification.Builder(this)
      val pending=PendingIntent.getActivity(this,2,packageManager.getLaunchIntentForPackage(packageName),PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT)
      val n=b.setSmallIcon(android.R.drawable.ic_menu_mylocation).setContentTitle("Пройдено ${milestone * every} шагов!").setContentText("Сегодня: $steps шагов. Продолжай в удобном темпе.").setContentIntent(pending).setAutoCancel(true).build()
      try{(getSystemService(NOTIFICATION_SERVICE) as NotificationManager).notify(6702,n)}catch(_:SecurityException){}
    }
  }
  override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {}
  override fun onBind(intent: Intent?): IBinder? = null
  override fun onDestroy() {running=false;handler.removeCallbacks(ticker);sensors.unregisterListener(this);stopForeground(STOP_FOREGROUND_REMOVE);super.onDestroy()}
}
