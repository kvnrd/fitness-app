package expo.modules.storeagesignal

import com.google.android.play.agesignals.AgeSignalsAccessRequest
import com.google.android.play.agesignals.AgeSignalsManagerFactory
import com.google.android.play.agesignals.AgeSignalsRequest
import com.google.android.play.agesignals.model.AgeSignalsStatus
import com.google.android.play.agesignals.model.SignificantChangeStatus
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

// Returns ONLY status + bounds. installId is never read, stored or returned.
class StoreAgeSignalModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("StoreAgeSignal")

    // `gates` is unused on Android: Play returns the bands configured in Play Console.
    AsyncFunction("requestAgeRange") { _: List<Int>, promise: Promise ->
      val activity = appContext.currentActivity
      if (activity == null) {
        promise.resolve(result("unavailable"))
        return@AsyncFunction
      }
      try {
        val manager = AgeSignalsManagerFactory.create(activity.applicationContext)
        val access = AgeSignalsAccessRequest.builder().setActivity(activity).build()
        manager.requestAgeSignalsAccess(access)
          .addOnSuccessListener { accessResult ->
            when (accessResult.ageSignalsStatus()) {
              AgeSignalsStatus.SHARED -> check(manager, promise)
              AgeSignalsStatus.NOT_SHARED -> promise.resolve(result("declined"))
              AgeSignalsStatus.VERIFICATION_REQUIRED -> promise.resolve(result("verification_required"))
              else -> promise.resolve(result("unavailable"))
            }
          }
          .addOnFailureListener { promise.resolve(result("unavailable")) }
      } catch (e: Exception) {
        promise.resolve(result("unavailable"))
      }
    }
  }

  private fun check(manager: com.google.android.play.agesignals.AgeSignalsManager, promise: Promise) {
    manager.checkAgeSignals(AgeSignalsRequest.builder().build())
      .addOnSuccessListener { r ->
        // A parent declining a significant change is the only revocation-like state the client can see.
        if (r.significantChangeStatus() == SignificantChangeStatus.DECLINED) {
          promise.resolve(result("revoked"))
          return@addOnSuccessListener
        }
        val lower = r.ageLower()
        val upper = r.ageUpper()
        if (lower == null && upper == null) promise.resolve(result("declined"))
        else promise.resolve(result("sharing", lower, upper))
      }
      .addOnFailureListener { promise.resolve(result("unavailable")) }
  }

  private fun result(status: String, lower: Int? = null, upper: Int? = null): Map<String, Any?> =
    mapOf("status" to status, "lower" to lower, "upper" to upper)
}
