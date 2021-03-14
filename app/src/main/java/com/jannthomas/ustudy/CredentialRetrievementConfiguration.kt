package com.jannthomas.ustudy

import kotlinx.serialization.Serializable

@Serializable
data class CredentialRetrievementConfiguration(
        val account: String? = null,

        val type: String?,
        val requirements: List<CredentialRequirement>
)