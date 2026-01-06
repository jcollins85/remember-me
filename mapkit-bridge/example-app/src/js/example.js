import { MapKitBridge } from 'mapkit-bridge';

window.testEcho = () => {
    const inputValue = document.getElementById("echoInput").value;
    MapKitBridge.echo({ value: inputValue })
}
