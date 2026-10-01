-keep class org.tensorflow.lite.** { *; }
-keep class com.google.android.gms.tflite.** { *; }
-dontwarn org.tensorflow.lite.**

-keep class androidx.camera.** { *; }
-dontwarn androidx.camera.**

-keepattributes Signature
-keepattributes *Annotation*
-keep class com.circe.visionplanification.data.stitch.** { *; }
-keep class com.circe.visionplanification.domain.model.** { *; }
