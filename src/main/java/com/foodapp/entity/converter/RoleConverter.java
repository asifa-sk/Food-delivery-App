package com.foodapp.entity.converter;

import com.foodapp.entity.enums.Role;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Converter(autoApply = false)
public class RoleConverter implements AttributeConverter<Role, String> {

    private static final Logger log = LoggerFactory.getLogger(RoleConverter.class);

    @Override
    public String convertToDatabaseColumn(Role attribute) {
        return attribute == null ? null : attribute.name();
    }

    @Override
    public Role convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isBlank()) {
            return Role.CUSTOMER;
        }
        try {
            return Role.valueOf(dbData.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            log.warn("Unknown role value '{}' found in database, defaulting to CUSTOMER", dbData);
            return Role.CUSTOMER;
        }
    }
}
