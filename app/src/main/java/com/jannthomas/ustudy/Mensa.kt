package com.jannthomas.ustudy

import kotlinx.serialization.Serializable

@Serializable
data class Mensa(
        val id: String,
        val name: String,
        val icon: String?,
        val additionalInfos: List<MensaInfo>,
        val availability: MensaAvailability? = null
)