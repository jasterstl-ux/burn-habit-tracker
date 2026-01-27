package com.burnhabittracker.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.widget.RemoteViews;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;

public class TodayWidgetProvider extends AppWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateWidget(context, appWidgetManager, appWidgetId);
        }
    }

    public static void updateAll(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        int[] ids = manager.getAppWidgetIds(new ComponentName(context, TodayWidgetProvider.class));
        for (int id : ids) {
            updateWidget(context, manager, id);
        }
    }

    private static void updateWidget(Context context, AppWidgetManager manager, int appWidgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_today);
        HabitSummary summary = loadSummary(context);

        views.setTextViewText(R.id.widget_status, "Done " + summary.done + "/" + summary.total);
        views.setTextViewText(R.id.widget_list, summary.listText);

        Intent launchIntent = new Intent(context, MainActivity.class);
        int flags = Build.VERSION.SDK_INT >= Build.VERSION_CODES.M
                ? PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT
                : PendingIntent.FLAG_UPDATE_CURRENT;
        PendingIntent pendingIntent = PendingIntent.getActivity(context, 0, launchIntent, flags);
        views.setOnClickPendingIntent(R.id.widget_root, pendingIntent);

        manager.updateAppWidget(appWidgetId, views);
    }

    private static HabitSummary loadSummary(Context context) {
        File file = new File(context.getFilesDir(), "habits-widget.json");
        if (!file.exists()) {
            return new HabitSummary(0, 0, "Open the app to start");
        }

        StringBuilder jsonBuilder = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(new FileReader(file))) {
            String line;
            while ((line = reader.readLine()) != null) {
                jsonBuilder.append(line);
            }

            JSONObject root = new JSONObject(jsonBuilder.toString());
            int total = root.optInt("total", 0);
            int done = root.optInt("done", 0);
            JSONArray items = root.optJSONArray("habits");

            StringBuilder list = new StringBuilder();
            if (items != null && items.length() > 0) {
                int max = Math.min(items.length(), 5);
                for (int i = 0; i < max; i += 1) {
                    JSONObject item = items.optJSONObject(i);
                    if (item == null) continue;
                    String name = item.optString("name", "");
                    boolean completed = item.optBoolean("done", false);
                    list.append(completed ? "✓ " : "• ")
                        .append(name)
                        .append("\n");
                }
            } else {
                list.append("No habits yet");
            }

            return new HabitSummary(done, total, list.toString().trim());
        } catch (Exception ex) {
            return new HabitSummary(0, 0, "Open the app to refresh");
        }
    }

    private static class HabitSummary {
        final int done;
        final int total;
        final String listText;

        HabitSummary(int done, int total, String listText) {
            this.done = done;
            this.total = total;
            this.listText = listText;
        }
    }
}
