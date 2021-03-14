package com.jannthomas.ustudy

import kotlinx.serialization.Serializable

@Serializable
data class Grade(
        val id: String,
        val name: String,
        val status: GradeStatus,
        val grade: String? = null,
        val credits: Int? = null,
        val numberOfTry: Int? = null,
        val overviewOfGrades: List<GradeOverviewItem>,
        val averageGrade: String
)