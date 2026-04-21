package com.foodapp.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class DatabaseMigrationRunner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DatabaseMigrationRunner.class);
    private final JdbcTemplate jdbcTemplate;

    public DatabaseMigrationRunner(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        migrate("user role enum values to uppercase", "UPDATE users SET role = UPPER(role) WHERE role IS NOT NULL");
        migrate("user role enum definition", "ALTER TABLE users MODIFY COLUMN role ENUM('CUSTOMER','RESTAURANT','DRIVER','ADMIN') NOT NULL DEFAULT 'CUSTOMER'");
        migrate("restaurant status values to uppercase", "UPDATE restaurants SET status = UPPER(status) WHERE status IS NOT NULL");
        migrate("restaurant status enum definition", "ALTER TABLE restaurants MODIFY COLUMN status ENUM('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING'");
        migrate("order status values to uppercase", "UPDATE orders SET status = UPPER(status) WHERE status IS NOT NULL");
        migrate("order status enum definition", "ALTER TABLE orders MODIFY COLUMN status ENUM('PENDING','CONFIRMED','PREPARING','OUT_FOR_DELIVERY','DELIVERED','CANCELLED') NOT NULL DEFAULT 'PENDING'");
        migrate("user phone_number nullable", "ALTER TABLE users MODIFY COLUMN phone_number VARCHAR(20) NULL DEFAULT NULL");
        migrate("ensure user otp_code column exists", "ALTER TABLE users ADD COLUMN otp_code VARCHAR(6) NULL");
        migrate("ensure fooditems rating column exists", "ALTER TABLE fooditems ADD COLUMN rating DECIMAL(3,2) NOT NULL DEFAULT 0.00");
        migrate("ensure fooditems review_count column exists", "ALTER TABLE fooditems ADD COLUMN review_count INT NOT NULL DEFAULT 0");
        migrate(
                "ensure food_item_reviews table exists",
                """
                CREATE TABLE IF NOT EXISTS food_item_reviews (
                  review_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                  order_id INT UNSIGNED NOT NULL,
                  order_item_id INT UNSIGNED NOT NULL,
                  item_id INT UNSIGNED NOT NULL,
                  restaurant_id INT UNSIGNED NOT NULL,
                  customer_id INT UNSIGNED NOT NULL,
                  rating INT NOT NULL,
                  comment TEXT NULL,
                  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                  CONSTRAINT chk_food_item_review_rating CHECK (rating BETWEEN 1 AND 5),
                  CONSTRAINT uq_food_item_review_order_item UNIQUE (order_item_id),
                  CONSTRAINT fk_review_order FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
                  CONSTRAINT fk_review_order_item FOREIGN KEY (order_item_id) REFERENCES orderitems(order_item_id) ON DELETE CASCADE,
                  CONSTRAINT fk_review_food_item FOREIGN KEY (item_id) REFERENCES fooditems(item_id) ON DELETE CASCADE,
                  CONSTRAINT fk_review_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurants(restaurant_id) ON DELETE CASCADE,
                  CONSTRAINT fk_review_customer FOREIGN KEY (customer_id) REFERENCES users(user_id) ON DELETE CASCADE
                )
                """
        );
            migrate(
                "ensure favorite_restaurants table exists",
                """
                CREATE TABLE IF NOT EXISTS favorite_restaurants (
                  favorite_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                  user_id BIGINT UNSIGNED NOT NULL,
                  restaurant_id BIGINT UNSIGNED NOT NULL,
                  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                  UNIQUE KEY uq_favorite_user_restaurant (user_id, restaurant_id),
                  CONSTRAINT fk_fav_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
                  CONSTRAINT fk_fav_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurants(restaurant_id) ON DELETE CASCADE
                )
                """
            );
    }

    private void migrate(String description, String sql) {
        try {
            jdbcTemplate.execute(sql);
            log.info("DB migration applied: {}", description);
        } catch (Exception e) {
            log.debug("DB migration skipped or already applied for {}: {}", description, e.getMessage());
        }
    }
}
