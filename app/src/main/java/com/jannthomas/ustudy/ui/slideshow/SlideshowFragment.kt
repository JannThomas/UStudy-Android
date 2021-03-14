package com.jannthomas.ustudy.ui.slideshow

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.RadioButton
import android.widget.RadioGroup
import android.widget.TextView
import androidx.fragment.app.Fragment
import androidx.lifecycle.Observer
import androidx.lifecycle.ViewModelProvider
import com.jannthomas.ustudy.Account
import com.jannthomas.ustudy.R

class SlideshowFragment : Fragment() {

    private lateinit var slideshowViewModel: SlideshowViewModel

    override fun onCreateView(
            inflater: LayoutInflater,
            container: ViewGroup?,
            savedInstanceState: Bundle?
    ): View? {
        slideshowViewModel =
                ViewModelProvider(this).get(SlideshowViewModel::class.java)
        val root = inflater.inflate(R.layout.fragment_slideshow, container, false)
        val textView: TextView = root.findViewById(R.id.text_slideshow)
        slideshowViewModel.text.observe(viewLifecycleOwner, Observer {
            textView.text = it
        })

        val radioGroup: RadioGroup = root.findViewById(R.id.radioGroup)
        val groups = Account.universityObject?.userGroups ?: listOf()
        var checkIndex: Int? = null
        groups.forEachIndexed { index, group ->
            val button = RadioButton(this.context)
            button.text = group.name
            button.id = index
            radioGroup.addView(button)

            if (group.id == Account.selectedUserGroup) {
                checkIndex = index
            }
        }
        radioGroup.setOnCheckedChangeListener { group, checkedId ->
            Account.selectedUserGroup = groups[checkedId].id
        }
        checkIndex?.let {
            radioGroup.check(it)
        }

        return root
    }
}