package com.jannthomas.ustudy

import kotlinx.serialization.Serializable

@Serializable
data class MensaAvailability(
        val start: String,
        val end: String
)