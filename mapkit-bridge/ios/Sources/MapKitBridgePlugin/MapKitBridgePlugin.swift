import Foundation
import Capacitor
import MapKit
import UIKit

/**
 * Please read the Capacitor iOS Plugin Development Guide
 * here: https://capacitorjs.com/docs/plugins/ios
 */
@objc(MapKitBridgePlugin)
public class MapKitBridgePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "MapKitBridgePlugin"
    public let jsName = "MapKitBridge"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "echo", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "ping", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "searchPlaces", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getSnapshot", returnType: CAPPluginReturnPromise)
    ]
    private let implementation = MapKitBridge()

    @objc func echo(_ call: CAPPluginCall) {
        let value = call.getString("value") ?? ""
        call.resolve([
            "value": implementation.echo(value)
        ])
    }
    
    @objc public func searchPlaces(_ call: CAPPluginCall) {
      let query = call.getString("query") ?? ""
      let trimmed = query.trimmingCharacters(in: .whitespacesAndNewlines)

      if trimmed.isEmpty {
        call.resolve(["results": []])
        return
      }

      let request = MKLocalSearch.Request()
      request.naturalLanguageQuery = trimmed

      // Optional: bias results near a coordinate if provided
      if let near = call.getObject("near"),
         let lat = near["lat"] as? Double,
         let lng = near["lng"] as? Double {
        let center = CLLocationCoordinate2D(latitude: lat, longitude: lng)
        request.region = MKCoordinateRegion(
          center: center,
          latitudinalMeters: 30000,
          longitudinalMeters: 30000
        )
      }

      let search = MKLocalSearch(request: request)
      search.start { response, error in
        if let error = error {
          call.reject("Search failed: \(error.localizedDescription)")
          return
        }

        let items = response?.mapItems ?? []
        let results: [[String: Any]] = items.compactMap { item in
          guard let location = item.placemark.location else { return nil }
          return [
            "name": item.name ?? "",
            "address": item.placemark.title ?? "",
            "lat": location.coordinate.latitude,
            "lng": location.coordinate.longitude
          ]
        }

        call.resolve(["results": results])
      }
    }
    
    @objc public func getSnapshot(_ call: CAPPluginCall) {
      guard let lat = call.getDouble("lat"), let lng = call.getDouble("lng") else {
        call.reject("lat and lng are required")
        return
      }
      
      let width = call.getInt("width") ?? 640
      let height = call.getInt("height") ?? 360
      let spanMeters = call.getDouble("spanMeters") ?? 1000
      
      let options = MKMapSnapshotter.Options()
      options.region = MKCoordinateRegion(
        center: CLLocationCoordinate2D(latitude: lat, longitude: lng),
        latitudinalMeters: spanMeters,
        longitudinalMeters: spanMeters
      )
      options.size = CGSize(width: CGFloat(width), height: CGFloat(height))
      options.scale = UIScreen.main.scale
      options.mapType = .standard
      
      let snapshotter = MKMapSnapshotter(options: options)
      let location = CLLocation(latitude: lat, longitude: lng)
      snapshotter.start { snapshot, error in
        if let error = error {
          call.reject("Snapshot failed: \(error.localizedDescription)")
          return
        }
        guard let snapshot = snapshot else {
          call.reject("Snapshot failed")
          return
        }
        
        let coordinate = CLLocationCoordinate2D(latitude: lat, longitude: lng)
        let finalImage = self.drawPin(on: snapshot, coordinate: coordinate)
        guard let data = finalImage.pngData() else {
          call.reject("Unable to encode snapshot")
          return
        }
        let base64 = data.base64EncodedString()
        
        let geocoder = CLGeocoder()
        geocoder.reverseGeocodeLocation(location) { placemarks, _ in
          var payload: [String: Any] = ["imageData": base64]
          if let placemark = placemarks?.first {
            payload["address"] = self.formatAddress(from: placemark)
          }
          call.resolve(payload)
        }
      }
    }
    
    private func drawPin(on snapshot: MKMapSnapshotter.Snapshot, coordinate: CLLocationCoordinate2D) -> UIImage {
      let image = snapshot.image
      let renderer = UIGraphicsImageRenderer(size: image.size)
      let pinColor = UIColor(red: 1.0, green: 0.42, blue: 0.1, alpha: 1.0)
      
      return renderer.image { context in
        image.draw(at: .zero)
        var point = snapshot.point(for: coordinate)
        if point.x < 0 || point.y < 0 || point.x > image.size.width || point.y > image.size.height {
          return
        }
        let pinSize: CGFloat = 14
        point.x -= pinSize / 2
        point.y -= pinSize
        context.cgContext.setShadow(offset: CGSize(width: 0, height: 3), blur: 6, color: UIColor.black.withAlphaComponent(0.25).cgColor)
        let pinRect = CGRect(x: point.x, y: point.y, width: pinSize, height: pinSize)
        context.cgContext.setFillColor(pinColor.cgColor)
        context.cgContext.fillEllipse(in: pinRect)
      }
    }
  
    private func formatAddress(from placemark: CLPlacemark) -> String {
      var segments: [String] = []
      if let number = placemark.subThoroughfare, let street = placemark.thoroughfare {
        segments.append("\(number) \(street)")
      } else if let street = placemark.thoroughfare {
        segments.append(street)
      } else if let name = placemark.name {
        segments.append(name)
      }
      
      if let city = placemark.locality {
        segments.append(city)
      }
      if let region = placemark.administrativeArea {
        segments.append(region)
      }
      if let country = placemark.country {
        segments.append(country)
      }
      return segments.joined(separator: " · ")
    }
}
