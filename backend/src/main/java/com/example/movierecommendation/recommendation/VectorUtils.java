package com.example.movierecommendation.recommendation;

import java.util.ArrayList;
import java.util.List;

public class VectorUtils {

    private VectorUtils() {
    }

    public static String toPgVector(double[] vector) {
        StringBuilder builder = new StringBuilder();
        builder.append("[");

        for (int i = 0; i < vector.length; i++) {
            if (i > 0) {
                builder.append(",");
            }

            builder.append(vector[i]);
        }

        builder.append("]");
        return builder.toString();
    }

    public static double[] parsePgVector(String text) {
        if (text == null || text.isBlank()) {
            return new double[0];
        }

        String cleaned = text.replace("[", "").replace("]", "");
        String[] parts = cleaned.split(",");
        List<Double> values = new ArrayList<>();

        for (String part : parts) {
            if (part == null || part.isBlank()) {
                continue;
            }

            values.add(Double.parseDouble(part.trim()));
        }

        double[] vector = new double[values.size()];

        for (int i = 0; i < values.size(); i++) {
            vector[i] = values.get(i);
        }

        return vector;
    }

    public static void normalize(double[] vector) {
        double sum = 0.0;

        for (double value : vector) {
            sum += value * value;
        }

        if (sum <= 0.0) {
            return;
        }

        double norm = Math.sqrt(sum);

        for (int i = 0; i < vector.length; i++) {
            vector[i] = vector[i] / norm;
        }
    }

    public static int hashToIndex(Long id, int start, int length) {
        if (id == null) {
            return start;
        }

        int hash = Math.abs(id.hashCode());
        return start + hash % length;
    }
}