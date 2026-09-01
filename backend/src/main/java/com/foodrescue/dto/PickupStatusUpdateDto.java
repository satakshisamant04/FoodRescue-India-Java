package com.foodrescue.dto;

import com.foodrescue.model.PickupStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class PickupStatusUpdateDto {
    @NotNull(message = "Status is required")
    private PickupStatus status;

    private String notes;
}
