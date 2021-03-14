package com.jannthomas.ustudy

import kotlinx.serialization.Serializable

@Serializable
data class FetchArguments(
        val method: String? = null,
        val headers: Map<String, String>? = null,
        val body: String? = null
)