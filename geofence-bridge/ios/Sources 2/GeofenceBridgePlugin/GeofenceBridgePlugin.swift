import Foundation
import Capacitor
import CoreLocation
import UserNotifications

/**
 * Please read the Capacitor iOS Plugin Development Guide
 * here: https://capacitorjs.com/docs/plugins/ios
 */
@objc(GeofenceBridgePlugin)
public class GeofenceBridgePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "GeofenceBridgePlugin"
    public let jsName = "GeofenceBridge"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "requestPermissions", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "startMonitoring", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stopMonitoring", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "openSettings", returnType: CAPPluginReturnPromise)
    ]
    private let implementation = GeofenceBridge()

    public override func load() {
        NotificationCenter.default.addObserver(self,
                                               selector: #selector(regionEnter(_:)),
                                               name: .geofenceRegionEnter,
                                               object: nil)
    }

    @objc public override func requestPermissions(_ call: CAPPluginCall) {
        implementation.requestLocationPermission { status in
            self.implementation.clearPendingPermission()
            UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) { granted, _ in
                let notificationState: String = granted ? "granted" : "denied"
                let locationState: String = status == .authorizedAlways ? "granted" : "denied"
                call.resolve([
                    "location": locationState,
                    "notifications": notificationState
                ])
            }
        }
    }

    @objc public func startMonitoring(_ call: CAPPluginCall) {
        guard implementation.currentPermission() == .authorizedAlways else {
            call.reject("Location permission not granted")
            return
        }
        guard let venues = call.getArray("venues") as? [[String: Any]] else {
            call.reject("venues array required")
            return
        }
        implementation.updateVenues(venues)
        call.resolve()
    }

    @objc public func stopMonitoring(_ call: CAPPluginCall) {
        implementation.stopMonitoring()
        call.resolve()
    }

    @objc public func openSettings(_ call: CAPPluginCall) {
        guard let url = URL(string: UIApplication.openSettingsURLString) else {
            call.reject("Unable to open settings")
            return
        }
        DispatchQueue.main.async {
            UIApplication.shared.open(url)
        }
        call.resolve()
    }

    @objc private func regionEnter(_ notification: Notification) {
        guard let data = notification.userInfo as? [String: Any] else { return }
        notifyListeners("regionEnter", data: data)
    }
}
