import Foundation
import CoreLocation
import UserNotifications

@objc public class GeofenceBridge: NSObject, CLLocationManagerDelegate {
    private let locationManager = CLLocationManager()
    private var pendingPermissionCall: ((CLAuthorizationStatus) -> Void)?
    private var venueNames: [String: String?] = [:]
    private let regionRadius: CLLocationDistance = 100

    public override init() {
        super.init()
        locationManager.delegate = self
        locationManager.desiredAccuracy = kCLLocationAccuracyBest
    }

    @objc public func currentPermission() -> CLAuthorizationStatus {
        if #available(iOS 14.0, *) {
            return locationManager.authorizationStatus
        } else {
            return CLLocationManager.authorizationStatus()
        }
    }

    public func requestLocationPermission(completion: @escaping (CLAuthorizationStatus) -> Void) {
        let status = currentPermission()
        switch status {
        case .authorizedAlways:
            completion(status)
        case .denied, .restricted:
            completion(status)
        default:
            pendingPermissionCall = completion
            locationManager.requestAlwaysAuthorization()
        }
    }

    public func clearPendingPermission() {
        pendingPermissionCall = nil
    }

    public func updateVenues(_ venues: [[String: Any]]) {
        venueNames.removeAll()
        locationManager.monitoredRegions.forEach { region in
            locationManager.stopMonitoring(for: region)
        }

        venues.forEach { venueDict in
            guard let id = venueDict["id"] as? String,
                  let lat = venueDict["lat"] as? CLLocationDegrees,
                  let lon = venueDict["lon"] as? CLLocationDegrees else { return }
            let region = CLCircularRegion(center: CLLocationCoordinate2D(latitude: lat, longitude: lon),
                                          radius: regionRadius,
                                          identifier: id)
            region.notifyOnEntry = true
            region.notifyOnExit = false
            venueNames[id] = venueDict["name"] as? String
            locationManager.startMonitoring(for: region)
        }
    }

    public func stopMonitoring() {
        venueNames.removeAll()
        locationManager.monitoredRegions.forEach { region in
            locationManager.stopMonitoring(for: region)
        }
    }

    public func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        guard let completion = pendingPermissionCall else { return }
        completion(currentPermission())
        pendingPermissionCall = nil
    }

    public func locationManager(_ manager: CLLocationManager, didChangeAuthorization status: CLAuthorizationStatus) {
        guard let completion = pendingPermissionCall else { return }
        completion(status)
        pendingPermissionCall = nil
    }

    public func locationManager(_ manager: CLLocationManager, didEnterRegion region: CLRegion) {
        guard let circular = region as? CLCircularRegion else { return }
        let name = venueNames[circular.identifier] ?? nil
        NotificationCenter.default.post(name: .geofenceRegionEnter,
                                        object: nil,
                                        userInfo: ["id": circular.identifier, "name": name as Any])
    }

    public func locationManager(_ manager: CLLocationManager, monitoringDidFailFor region: CLRegion?, withError error: Error) {
        print("[GeofenceBridge] monitoring failed: \(error.localizedDescription)")
    }
}

extension Notification.Name {
    static let geofenceRegionEnter = Notification.Name("geofenceRegionEnter")
}
