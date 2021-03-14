package com.jannthomas.ustudy

import kotlinx.serialization.Serializable

@Serializable
data class Meal(
        val name: String,
        val subtitle: String,
        val group: String? = null,
        val imageUrl: String? = null,
        val imageUrlBig: String? = null,
        val prices: Map<String, String>,
        val mensa: String
)