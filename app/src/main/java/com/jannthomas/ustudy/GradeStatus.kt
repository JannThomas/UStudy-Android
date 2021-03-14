package com.jannthomas.ustudy

import kotlinx.serialization.Serializable

@Serializable
enum class GradeStatus {
    passed, failed, unknown
}