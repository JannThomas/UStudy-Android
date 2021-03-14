package com.jannthomas.ustudy

import kotlinx.serialization.Serializable

@Serializable
data class GradeOverviewItem(
        val grade: String,
        val quantity: Int
)