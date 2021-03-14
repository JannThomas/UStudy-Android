package com.jannthomas.ustudy.ui.gradeDetail

import android.os.Bundle
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.fragment.app.FragmentTransaction
import androidx.lifecycle.ViewModelProvider
import androidx.navigation.fragment.findNavController
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.jannthomas.ustudy.Account
import com.jannthomas.ustudy.Grade
import com.jannthomas.ustudy.R
import com.jannthomas.ustudy.ui.grades.GradeAdapter

class GradeDetailFragment(val grade: Grade) : Fragment() {

    private lateinit var gradesViewModel: GradeDetailViewModel

    override fun onCreateView(
            inflater: LayoutInflater,
            container: ViewGroup?,
            savedInstanceState: Bundle?
    ): View? {
        gradesViewModel =
                ViewModelProvider(this).get(GradeDetailViewModel::class.java)
        val root = inflater.inflate(R.layout.fragment_gradedetail, container, false)

        val gradeList: RecyclerView = root.findViewById(R.id.gradedetail_list)
        val llm = LinearLayoutManager(this.context)
        llm.orientation = LinearLayoutManager.VERTICAL
        gradeList.setLayoutManager(llm)

        val adapter = GradeDetailAdapter {
            Log.d("UStudy", "tapped detail: $it")
        }

        val list = mutableListOf(
                GradeDetail("Kennung", grade.id),
                GradeDetail("Name", grade.name),
                GradeDetail("Versuch", "${grade.numberOfTry ?: 0}"),
                GradeDetail("Credits", "${grade.credits ?: 0}"),
                GradeDetail("Note", grade.grade ?: "-"),
                GradeDetail("Durchschnittsnote", grade.averageGrade),
                GradeDetail("Notenspiegel", null),
        )
        for (overviewItem in grade.overviewOfGrades) {
            list.add(GradeDetail(overviewItem.grade, "${overviewItem.quantity}"))
        }

        adapter.submitList(list)

        gradeList.post {
            gradeList.adapter = adapter
        }

        return root
    }
}