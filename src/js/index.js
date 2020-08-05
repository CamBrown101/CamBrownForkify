import Search from "./models/Search";
import Recipe from "./models/Recipe";
import list from "./models/list";
import Likes from "./models/Likes";
import * as searchView from "./views/searchView";
import * as recipeView from "./views/recipeView";
import * as listView from "./views/listView";
import * as likesView from "./views/likesView";
import { elements, renderLoader, clearLoader } from "./views/base";
import List from "./models/list";

/** Global state of the app
 * --Search object
 * --Current recipe object
 * -- Shopping list object
 * -- liked recipes
 */

const state = {};

/**Search controller
 *
 */
const controlSearch = async () => {
  // 1) Get query from the view
  const query = searchView.getInput();

  console.log(query);
  if (query) {
    // 2) New search object and add to state
    state.search = new Search(query);

    //3) Prepare UI for results
    searchView.clearInput();
    searchView.clearResults();
    renderLoader(elements.searchRes);

    try {
      //4 Search for recipes
      await state.search.getResults();

      // 5) render results on UI
      clearLoader();
      searchView.renderResults(state.search.result);
    } catch (err) {
      alert("Something wrong with search...");
      clearLoader();
    }
  }
};

elements.searchForm.addEventListener("submit", (e) => {
  e.preventDefault();
  controlSearch();
});

elements.searchResPages.addEventListener("click", (e) => {
  const btn = e.target.closest(".btn-inline");
  if (btn) {
    const goToPage = parseInt(btn.dataset.goto, 10);
    searchView.clearResults();
    searchView.renderResults(state.search.result, goToPage);
  }
});

/**Recipe Controller
 *
 */
const controlRecipe = async () => {
  //Get ID from URL
  const id = window.location.hash.replace("#", "");
  //console.log(id);

  if (id) {
    //Prepare the UI for changes
    recipeView.clearRecipe();
    renderLoader(elements.recipe);
    //Highlight selected search item
    if (state.search) searchView.highlightSelected(id);
    //Create new recipe obj
    state.recipe = new Recipe(id);

    try {
      //Get recipe data and parse ingredients
      await state.recipe.getRecipe();
      //console.log(state.recipe.ingredients);
      state.recipe.parseIngredients();
      //Calc servings and time
      state.recipe.calcTime();
      state.recipe.calcServings();
      //Render recipe
      clearLoader();
      recipeView.renderRecipe(state.recipe, state.likes.isLiked(id));
    } catch (err) {
      console.log(err);
      alert("Something went Wrong");
    }
  }
};
["hashchange", "load"].forEach((event) =>
  window.addEventListener(event, controlRecipe)
);
const controlList = () => {
  //Create a new list if there is none yet
  if (!state.list) state.list = new List();

  //Add each ingredient to the list and user interface
  state.recipe.ingredients.forEach((el) => {
    const item = state.list.addItem(el.count, el.unit, el.ingredient);
    listView.renderItem(item);
  });
};

//Handle delete and update list events
elements.shopping.addEventListener("click", (e) => {
  const id = e.target.closest(".shopping__item").dataset.itemid;

  //Handle delete event
  if (e.target.matches(".shopping__delete, .shopping__delete *")) {
    // Delete from state
    state.list.deleteItem(id);
    //Delete from UI
    listView.deleteItem(id);

    //Handle count update
  } else if (e.target.matches(".shopping__count-value")) {
    const val = parseFloat(e.target.value, 10);
    state.list.updateCount(id, val);
  }
});

/**
 * Like Controller
 */
//testing
state.likes = new Likes();
likesView.toggleLikeMenu(state.likes.getNumLikes());
const controlLike = () => {
  if (!state.likes) state.likes = new Likes();
  const currentID = state.recipe.id;
  //User has not yet liked current recipe
  if (!state.likes.isLiked(currentID)) {
    // add like to the state
    const newLike = state.likes.addLike(
      currentID,
      state.recipe.title,
      state.recipe.author,
      state.recipe.img
    );
    // toggle the like button
    likesView.toggleLikeBtn(true);
    // add like to the ui list
    likesView.renderLike(newLike);
    // User has like current recipe
  } else {
    // remove like from the state
    state.likes.deleteLike(currentID);
    // toggle the like button
    likesView.toggleLikeBtn(false);
    // remove like from the ui list
    likesView.deleteLike(currentID);
  }
  likesView.toggleLikeMenu(state.likes.getNumLikes());
};
// restore liked recipes on page load
window.addEventListener("load", () => {
  state.likes = new Likes();
  // Restore likes
  state.likes.readStorage();
  //Toggle button
  likesView.toggleLikeMenu(state.likes.getNumLikes());
  // render the existong likes
  state.likes.likes.forEach((like) => likesView.renderLike(like));
});

//Handling recipe button clicks
elements.recipe.addEventListener("click", (e) => {
  if (e.target.matches(".btn-decrease, .btn-decrease *")) {
    // Decrease button is clicked
    if (state.recipe.servings > 1) {
      state.recipe.updateServings("dec");
      recipeView.updateServingsIngredients(state.recipe);
    }
  } else if (e.target.matches(".btn-increase, .btn-increase *")) {
    // Increase button is clicked
    state.recipe.updateServings("inc");
    recipeView.updateServingsIngredients(state.recipe);
  } else if (e.target.matches(".recipe__btn--add, .recipe__btn--add *")) {
    //Add ingredients to shopping list
    controlList();
  } else if (e.target.matches(".recipe__love, .recipe__love *")) {
    //Like controller
    controlLike();
  }
});
