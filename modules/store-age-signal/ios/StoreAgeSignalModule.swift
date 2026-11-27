import ExpoModulesCore
import UIKit
#if canImport(DeclaredAgeRange)
import DeclaredAgeRange
#endif

// Returns ONLY status + whole-year bounds. No declaration type, dates or raw object leave this file.
public class StoreAgeSignalModule: Module {
  public func definition() -> ModuleDefinition {
    Name("StoreAgeSignal")

    // async closure: runOnQueue(.main) isn't allowed on it (Swift compile error on SDK 58).
    // request(gates:) is @MainActor, so it still runs on the main thread.
    AsyncFunction("requestAgeRange") { (gates: [Int]) async -> [String: Any?] in
      return await StoreAgeSignalModule.request(gates: gates)
    }
  }

  private static func result(_ status: String, _ lower: Int? = nil, _ upper: Int? = nil) -> [String: Any?] {
    return ["status": status, "lower": lower, "upper": upper]
  }

  @MainActor
  private static func request(gates: [Int]) async -> [String: Any?] {
    #if canImport(DeclaredAgeRange)
    guard #available(iOS 26.0, *) else { return result("unavailable") }
    // The API accepts one to three gates.
    let g = Array(gates.prefix(3))
    guard let first = g.first else { return result("unavailable") }
    guard let vc = topViewController() else { return result("unavailable") }
    do {
      let response: AgeRangeService.Response
      switch g.count {
      case 1: response = try await AgeRangeService.shared.requestAgeRange(ageGates: first, in: vc)
      case 2: response = try await AgeRangeService.shared.requestAgeRange(ageGates: first, g[1], in: vc)
      default: response = try await AgeRangeService.shared.requestAgeRange(ageGates: first, g[1], g[2], in: vc)
      }
      switch response {
      case .sharing(let range):
        return result("sharing", range.lowerBound, range.upperBound)
      case .declinedSharing:
        return result("declined")
      @unknown default:
        return result("unavailable")
      }
    } catch {
      // notAvailable, invalidRequest, or anything else: no signal. Never log the error.
      return result("unavailable")
    }
    #else
    return result("unavailable")
    #endif
  }

  @MainActor
  private static func topViewController() -> UIViewController? {
    let scenes = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }
    let windows = scenes.flatMap { $0.windows }
    guard let root = (windows.first { $0.isKeyWindow } ?? windows.first)?.rootViewController else { return nil }
    var top = root
    while let presented = top.presentedViewController { top = presented }
    return top
  }
}
