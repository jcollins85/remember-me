package com.eraone.methere.mapkit;

import com.getcapacitor.Logger;

public class MapKitBridge {

    public String echo(String value) {
        Logger.info("Echo", value);
        return value;
    }
}
