package com.jannthomas.ustudy.ui.grades

import android.annotation.SuppressLint
import android.os.Bundle
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.appcompat.app.AppCompatActivity
import androidx.fragment.app.Fragment
import androidx.fragment.app.FragmentTransaction
import androidx.lifecycle.ViewModelProvider
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.jannthomas.ustudy.Account
import com.jannthomas.ustudy.R
import com.jannthomas.ustudy.ui.gradeDetail.GradeDetailFragment


class GradesFragment : Fragment() {

    private lateinit var gradesViewModel: GradesViewModel

    override fun onCreateView(
            inflater: LayoutInflater,
            container: ViewGroup?,
            savedInstanceState: Bundle?
    ): View? {
        gradesViewModel =
                ViewModelProvider(this).get(GradesViewModel::class.java)
        val root = inflater.inflate(R.layout.fragment_gallery, container, false)

        val gradeList: RecyclerView = root.findViewById(R.id.grade_list)
        val llm = LinearLayoutManager(this.context)
        llm.orientation = LinearLayoutManager.VERTICAL
        gradeList.setLayoutManager(llm)

        //findNavController

        Account.getGrades { grades ->
            val adapter = GradeAdapter {
                Log.d("UStudy", "tapped grade: $it")
                val myFragment: Fragment = GradeDetailFragment(it)

                val ft: FragmentTransaction = parentFragmentManager.beginTransaction()
                ft.replace(this.id, myFragment)
                ft.setTransition(FragmentTransaction.TRANSIT_FRAGMENT_OPEN)
                ft.addToBackStack(null)
                ft.commit()
            }
            adapter.submitList(grades)

            gradeList.post {
                gradeList.adapter = adapter
            }
        }

        return root
    }
}