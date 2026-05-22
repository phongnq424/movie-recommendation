package com.example.movierecommendation.common;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.domain.Page;

import java.util.List;

@Getter
@Setter
@Builder
public class PageResponse<T> {

    private List<T> content;

    private int page;
    private int size;

    private long totalElements;
    private int totalPages;

    private boolean first;
    private boolean last;
    private boolean empty;

    public static <T> PageResponse<T> from(Page<T> pageData) {
        return PageResponse.<T>builder()
                .content(pageData.getContent())
                .page(pageData.getNumber())
                .size(pageData.getSize())
                .totalElements(pageData.getTotalElements())
                .totalPages(pageData.getTotalPages())
                .first(pageData.isFirst())
                .last(pageData.isLast())
                .empty(pageData.isEmpty())
                .build();
    }
}