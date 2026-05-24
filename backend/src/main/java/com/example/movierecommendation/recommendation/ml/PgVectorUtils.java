package com.example.movierecommendation.recommendation.ml;

public final class PgVectorUtils {

    private PgVectorUtils() {
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
        double[] result = new double[parts.length];

        for (int i = 0; i < parts.length; i++) {
            result[i] = Double.parseDouble(parts[i].trim());
        }

        return result;
    }

    public static double[] normalize(float[] input) {
        double[] vector = new double[input.length];
        double sum = 0.0;

        for (int i = 0; i < input.length; i++) {
            vector[i] = input[i];
            sum += vector[i] * vector[i];
        }

        if (sum <= 0.0) {
            return vector;
        }

        double norm = Math.sqrt(sum);

        for (int i = 0; i < vector.length; i++) {
            vector[i] = vector[i] / norm;
        }

        return vector;
    }
}