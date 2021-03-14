package com.jannthomas.ustudy

import kotlinx.serialization.Serializable

@Serializable
data class UserGroup(
        val id: String,
        val name: String
)
