package com.jannthomas.ustudy

import kotlinx.serialization.Serializable

@Serializable
data class University(
        val userGroups: List<UserGroup>?
)
