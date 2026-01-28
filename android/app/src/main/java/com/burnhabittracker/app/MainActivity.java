package com.burnhabittracker.app;

import com.getcapacitor.BridgeActivity;

import android.os.Bundle;

public class MainActivity extends BridgeActivity {
	@Override
	protected void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		registerPlugin(WidgetPlugin.class);
	}

	@Override
	public void onResume() {
		super.onResume();
		TodayWidgetProvider.updateAll(this);
	}
}
