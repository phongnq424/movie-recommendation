package com.example.movierecommendation;

import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@Disabled("Disabled during unit testing because full Spring context requires test database configuration")
@SpringBootTest
class MovieRecommendationApplicationTests {

    @Test
    void contextLoads() {
    }

}
