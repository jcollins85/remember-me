import { GeofenceBridge } from 'geofence-bridge';

window.testEcho = () => {
    const inputValue = document.getElementById("echoInput").value;
    GeofenceBridge.echo({ value: inputValue })
}
