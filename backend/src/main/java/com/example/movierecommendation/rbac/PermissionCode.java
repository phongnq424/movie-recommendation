package com.example.movierecommendation.rbac;

public final class PermissionCode {

    private PermissionCode() {
    }

    public static final String USER_READ = "USER_READ";
    public static final String USER_UPDATE = "USER_UPDATE";
    public static final String USER_CHANGE_STATUS = "USER_CHANGE_STATUS";
    public static final String USER_DELETE = "USER_DELETE";
    public static final String USER_ASSIGN_ROLE = "USER_ASSIGN_ROLE";

    public static final String ROLE_READ = "ROLE_READ";
    public static final String ROLE_CREATE = "ROLE_CREATE";
    public static final String ROLE_UPDATE = "ROLE_UPDATE";
    public static final String ROLE_DELETE = "ROLE_DELETE";
    public static final String ROLE_ASSIGN_PERMISSION = "ROLE_ASSIGN_PERMISSION";

    public static final String PERMISSION_READ = "PERMISSION_READ";

    public static final String MOVIE_READ_ADMIN = "MOVIE_READ_ADMIN";
    public static final String MOVIE_CREATE = "MOVIE_CREATE";
    public static final String MOVIE_UPDATE = "MOVIE_UPDATE";
    public static final String MOVIE_CHANGE_STATUS = "MOVIE_CHANGE_STATUS";
    public static final String MOVIE_DELETE = "MOVIE_DELETE";

    public static final String ACTOR_READ_ADMIN = "ACTOR_READ_ADMIN";
    public static final String ACTOR_CREATE = "ACTOR_CREATE";
    public static final String ACTOR_UPDATE = "ACTOR_UPDATE";
    public static final String ACTOR_CHANGE_STATUS = "ACTOR_CHANGE_STATUS";
    public static final String ACTOR_DELETE = "ACTOR_DELETE";

    public static final String GENRE_READ_ADMIN = "GENRE_READ_ADMIN";
    public static final String GENRE_CREATE = "GENRE_CREATE";
    public static final String GENRE_UPDATE = "GENRE_UPDATE";
    public static final String GENRE_CHANGE_STATUS = "GENRE_CHANGE_STATUS";
    public static final String GENRE_DELETE = "GENRE_DELETE";

    public static final String MOVIE_CAST_MANAGE = "MOVIE_CAST_MANAGE";
    public static final String MOVIE_GENRE_MANAGE = "MOVIE_GENRE_MANAGE";

    public static final String REVIEW_WRITE = "REVIEW_WRITE";
    public static final String REVIEW_READ_OWN = "REVIEW_READ_OWN";
    public static final String REVIEW_UPDATE_OWN = "REVIEW_UPDATE_OWN";
    public static final String REVIEW_DELETE_OWN = "REVIEW_DELETE_OWN";
    public static final String REVIEW_READ_ADMIN = "REVIEW_READ_ADMIN";
    public static final String REVIEW_MODERATE = "REVIEW_MODERATE";
    public static final String REVIEW_DELETE_ANY = "REVIEW_DELETE_ANY";

    public static final String RATING_WRITE = "RATING_WRITE";
    public static final String RATING_READ_ADMIN = "RATING_READ_ADMIN";

    public static final String RECOMMENDATION_READ_OWN = "RECOMMENDATION_READ_OWN";
    public static final String RECOMMENDATION_REFRESH_OWN = "RECOMMENDATION_REFRESH_OWN";
    public static final String RECOMMENDATION_REFRESH_PUBLIC = "RECOMMENDATION_REFRESH_PUBLIC";

    public static final String INTERACTION_WRITE = "INTERACTION_WRITE";
    public static final String INTERACTION_READ_OWN = "INTERACTION_READ_OWN";
}