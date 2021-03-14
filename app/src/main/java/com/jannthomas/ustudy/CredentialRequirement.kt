package com.jannthomas.ustudy

import kotlinx.serialization.Serializable

@Serializable
data class CredentialRequirement(
        val id: String,
        val type: String? = null,
        val shouldSave: Boolean? = null,
        val isPassword: Boolean? = null,
        val isUserEnterable: Boolean? = null,

        /// Options to be able to choose from.
        val options: List<String>? = null
)