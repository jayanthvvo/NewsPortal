package com.example.article.DTO;



public class ArticleLikeResponse {

    private Long articleId;
    private boolean liked;
    private long likeCount;

    public ArticleLikeResponse(
            Long articleId,
            boolean liked,
            long likeCount) {

        this.articleId = articleId;
        this.liked = liked;
        this.likeCount = likeCount;
    }

    public Long getArticleId() {
        return articleId;
    }

    public boolean isLiked() {
        return liked;
    }

    public long getLikeCount() {
        return likeCount;
    }
}