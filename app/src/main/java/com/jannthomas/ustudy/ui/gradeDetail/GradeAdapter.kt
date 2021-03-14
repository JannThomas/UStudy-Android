package com.jannthomas.ustudy.ui.gradeDetail

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

data class GradeDetail(
        val title: String,
        val value: String?
)

class GradeDetailAdapter(private val onClick: (GradeDetail) -> Unit):
        ListAdapter<GradeDetail, GradeDetailAdapter.GradeViewHolder>(GradeDetailDiffCallback) {

    /* ViewHolder for Grade, takes in the inflated view and the onClick behavior. */
    class GradeViewHolder(itemView: View, val onClick: (GradeDetail) -> Unit) :
            RecyclerView.ViewHolder(itemView) {
        private val titleView: TextView = itemView.findViewById(R.id.gradeDetail_titleView)
        private var currentItem: GradeDetail? = null

        init {
            itemView.setOnClickListener {
                currentItem?.let {
                    onClick(it)
                }
            }
        }

        /* Bind meal names and image. */
        fun bind(detail: GradeDetail) {
            currentItem = detail

            if (detail.title.isEmpty()) {
                titleView.text = "-"
            } else {
                titleView.text = detail.title
            }
            detail.value?.let {
                val valueView = itemView.findViewById<TextView>(R.id.gradeDetail_valueView)

                if (detail.value.isEmpty()) {
                    valueView.text = "-"
                } else {
                    valueView.text = detail.value
                }
            }
        }
    }

    override fun getItemViewType(position: Int): Int {
        if (getItem(position).value == null) {
            return 1
        }
        return 0
    }

    /* Creates and inflates view and return GradeViewHolder. */
    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): GradeViewHolder {
        if (viewType == 1) {
            val view = LayoutInflater.from(parent.context)
                    .inflate(R.layout.gradedetail_header, parent, false)
            return GradeViewHolder(view, onClick)
        }
        val view = LayoutInflater.from(parent.context)
                .inflate(R.layout.gradedetail_item, parent, false)
        return GradeViewHolder(view, onClick)
    }

    /* Gets current grade and uses it to bind view. */
    override fun onBindViewHolder(holder: GradeViewHolder, position: Int) {
        val grade = getItem(position)
        holder.bind(grade)
    }
}

object GradeDetailDiffCallback : DiffUtil.ItemCallback<GradeDetail>() {
    override fun areItemsTheSame(oldItem: GradeDetail, newItem: GradeDetail): Boolean {
        return oldItem == newItem
    }

    override fun areContentsTheSame(oldItem: GradeDetail, newItem: GradeDetail): Boolean {
        return oldItem.title == newItem.title
    }
}