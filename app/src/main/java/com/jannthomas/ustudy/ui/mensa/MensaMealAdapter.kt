package com.jannthomas.ustudy.ui.mensa

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.os.AsyncTask
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.TextView
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.jannthomas.ustudy.Account
import com.jannthomas.ustudy.Meal
import com.jannthomas.ustudy.R
import java.io.InputStream
import java.net.URL


private class DownloadImageTask(var bmImage: ImageView) : AsyncTask<String?, Void?, Bitmap?>() {

    override fun onPostExecute(result: Bitmap?) {
        bmImage.setImageBitmap(result)
    }

    override fun doInBackground(vararg params: String?): Bitmap? {
        val urldisplay = params[0]
        var mIcon11: Bitmap? = null
        try {
            val `in`: InputStream = URL(urldisplay).openStream()
            mIcon11 = BitmapFactory.decodeStream(`in`)
        } catch (e: Exception) {
            Log.e("Error", e.message ?: "No message")
            e.printStackTrace()
        }
        return mIcon11
    }
}

class MensaMealAdapter(private val onClick: (Meal) -> Unit):
        ListAdapter<Meal, MensaMealAdapter.MensaMealViewHolder>(MealDiffCallback) {

    /* ViewHolder for Meal, takes in the inflated view and the onClick behavior. */
    class MensaMealViewHolder(itemView: View, val onClick: (Meal) -> Unit) :
            RecyclerView.ViewHolder(itemView) {
        private val titleView: TextView = itemView.findViewById(R.id.meal_titleView)
        private val subtitleView: TextView = itemView.findViewById(R.id.meal_subtitleView)
        private val priceView: TextView = itemView.findViewById(R.id.meal_priceView)
        private val imageView: ImageView = itemView.findViewById(R.id.meal_image)
        private var currentMeal: Meal? = null

        init {
            itemView.setOnClickListener {
                currentMeal?.let {
                    onClick(it)
                }
            }
        }

        /* Bind meal names and image. */
        fun bind(meal: Meal) {
            currentMeal = meal

            titleView.text = meal.name
            subtitleView.text = meal.subtitle
            // TODO: use setting to obtain the right value
            priceView.text = meal.prices[Account.selectedUserGroup] + "€"

            DownloadImageTask(imageView)
                    .execute(meal.imageUrl)
        }
    }

    /* Creates and inflates view and return MensaMealViewHolder. */
    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): MensaMealViewHolder {
        val view = LayoutInflater.from(parent.context)
                .inflate(R.layout.mensa_meal_item, parent, false)
        return MensaMealViewHolder(view, onClick)
    }

    /* Gets current meal and uses it to bind view. */
    override fun onBindViewHolder(holder: MensaMealViewHolder, position: Int) {
        val meal = getItem(position)
        holder.bind(meal)
    }
}

object MealDiffCallback : DiffUtil.ItemCallback<Meal>() {
    override fun areItemsTheSame(oldItem: Meal, newItem: Meal): Boolean {
        return oldItem == newItem
    }

    override fun areContentsTheSame(oldItem: Meal, newItem: Meal): Boolean {
        return oldItem.name == newItem.name
    }
}