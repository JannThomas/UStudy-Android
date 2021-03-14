package com.jannthomas.ustudy.ui.grades

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.jannthomas.ustudy.Grade
import com.jannthomas.ustudy.GradeStatus
import com.jannthomas.ustudy.R

class GradeAdapter(private val onClick: (Grade) -> Unit):
        ListAdapter<Grade, GradeAdapter.GradeViewHolder>(GradeDiffCallback) {

    /* ViewHolder for Grade, takes in the inflated view and the onClick behavior. */
    class GradeViewHolder(itemView: View, val onClick: (Grade) -> Unit) :
            RecyclerView.ViewHolder(itemView) {
        private val titleView: TextView = itemView.findViewById(R.id.grade_titleView)
        private val statusView: TextView = itemView.findViewById(R.id.grade_subtitleView)
        private val gradeView: TextView = itemView.findViewById(R.id.grade_gradeView)
        private val creditsView: TextView = itemView.findViewById(R.id.grade_creditsView)
        private var currentGrade: Grade? = null

        init {
            itemView.setOnClickListener {
                currentGrade?.let {
                    onClick(it)
                }
            }
        }

        /* Bind meal names and image. */
        fun bind(grade: Grade) {
            currentGrade = grade

            titleView.text = grade.name

            when (grade.status) {
                GradeStatus.passed -> statusView.text = "Bestanden"
                GradeStatus.failed -> statusView.text = "Durchgefallen"
                GradeStatus.unknown -> statusView.text = "Unbekannter Status"
            }

            gradeView.text = ""
            creditsView.text = ""
            grade.grade?.let {
                if (it.isNotEmpty()) {
                    gradeView.text = "Note: $it"
                }
            }
            grade.credits?.let {
                if (it > 0) {
                    creditsView.text = "Credits: $it"
                }
            }
        }
    }

    /* Creates and inflates view and return GradeViewHolder. */
    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): GradeViewHolder {
        val view = LayoutInflater.from(parent.context)
                .inflate(R.layout.grade_item, parent, false)
        return GradeViewHolder(view, onClick)
    }

    /* Gets current grade and uses it to bind view. */
    override fun onBindViewHolder(holder: GradeViewHolder, position: Int) {
        val grade = getItem(position)
        holder.bind(grade)
    }
}

object GradeDiffCallback : DiffUtil.ItemCallback<Grade>() {
    override fun areItemsTheSame(oldItem: Grade, newItem: Grade): Boolean {
        return oldItem == newItem
    }

    override fun areContentsTheSame(oldItem: Grade, newItem: Grade): Boolean {
        return oldItem.name == newItem.name
    }
}