<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class CategoryController extends Controller
{
    /**
     * Afficher la liste des catégories
     */
    public function index(Request $request)
    {
        try {
            $query = Category::query();

            // Filtrer par statut si demandé
            if ($request->has('active')) {
                $query->where('is_active', $request->boolean('active'));
            }

            // Recherche par nom
            if ($request->filled('search')) {
                $query->where('name', 'like', '%' . $request->search . '%');
            }

            // Ajouter le comptage des sons si la relation existe
            try {
                $query->withCount(['sounds' => function($q) {
                    $q->where('status', 'published');
                }]);
            } catch (\Exception $e) {
                // Si la relation échoue, on continue sans le comptage
                error_log('Erreur lors du comptage des sons: ' . $e->getMessage());
            }

            // Ordre par défaut
            $query->ordered();

            $categories = $query->get();

            // Ajouter manuellement sounds_count à 0 si pas défini
            $categories->each(function($category) {
                if (!isset($category->sounds_count)) {
                    $category->sounds_count = 0;
                }
            });

            return response()->json([
                'success' => true,
                'categories' => $categories
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du chargement des catégories',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Stocker une nouvelle catégorie
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:categories',
            'description' => 'nullable|string|max:1000',
            'color' => 'nullable|string|regex:/^#[0-9A-Fa-f]{6}$/',
            'icon' => 'nullable|string|max:50',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,svg|max:2048',
            'is_active' => 'boolean',
            'sort_order' => 'nullable|integer|min:0'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Erreurs de validation',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $categoryData = [
                'name' => $request->name,
                'slug' => Str::slug($request->name),
                'description' => $request->description,
                'color' => $request->color ?? '#8b5cf6',
                'icon' => $request->icon ?? 'faMusic',
                'is_active' => $request->boolean('is_active', true),
                'sort_order' => $request->sort_order ?? 0,
            ];

            // Gestion de l'upload d'image
            if ($request->hasFile('image')) {
                $imagePath = $request->file('image')->store('categories', 'public');
                $categoryData['image_url'] = asset('storage/' . $imagePath);
            }

            $category = Category::create($categoryData);

            return response()->json([
                'success' => true,
                'message' => 'Catégorie créée avec succès',
                'category' => $category
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la création de la catégorie',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Afficher une catégorie spécifique
     */
    public function show(Category $category)
    {
        return response()->json([
            'success' => true,
            'category' => $category
        ]);
    }

    /**
     * Mettre à jour une catégorie
     */
    public function update(Request $request, Category $category)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:categories,name,' . $category->id,
            'description' => 'nullable|string|max:1000',
            'color' => 'nullable|string|regex:/^#[0-9A-Fa-f]{6}$/',
            'icon' => 'nullable|string|max:50',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,svg|max:2048',
            'is_active' => 'boolean',
            'sort_order' => 'nullable|integer|min:0'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Erreurs de validation',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $categoryData = [
                'name' => $request->name,
                'description' => $request->description,
                'color' => $request->color ?? $category->color,
                'icon' => $request->icon ?? $category->icon,
                'is_active' => $request->boolean('is_active', $category->is_active),
                'sort_order' => $request->sort_order ?? $category->sort_order,
            ];

            // Gestion de l'upload d'image
            if ($request->hasFile('image')) {
                // Supprimer l'ancienne image si elle existe
                if ($category->image_url) {
                    $oldImagePath = str_replace(asset('storage/'), '', $category->image_url);
                    if (Storage::disk('public')->exists($oldImagePath)) {
                        Storage::disk('public')->delete($oldImagePath);
                    }
                }

                $imagePath = $request->file('image')->store('categories', 'public');
                $categoryData['image_url'] = asset('storage/' . $imagePath);
            }

            // Régénérer le slug si le nom a changé
            if ($request->name !== $category->name) {
                $categoryData['slug'] = Str::slug($request->name);
            }

            $category->update($categoryData);

            return response()->json([
                'success' => true,
                'message' => 'Catégorie mise à jour avec succès',
                'category' => $category->fresh()
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour de la catégorie',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Supprimer une catégorie
     */
    public function destroy(Category $category)
    {
        try {
            // Supprimer l'image associée si elle existe
            if ($category->image_url) {
                $imagePath = str_replace(asset('storage/'), '', $category->image_url);
                if (Storage::disk('public')->exists($imagePath)) {
                    Storage::disk('public')->delete($imagePath);
                }
            }

            $category->delete();

            return response()->json([
                'success' => true,
                'message' => 'Catégorie supprimée avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression de la catégorie',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Activer/désactiver une catégorie
     */
    public function toggleStatus(Category $category)
    {
        try {
            $category->update([
                'is_active' => !$category->is_active
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Statut de la catégorie mis à jour',
                'category' => $category->fresh()
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour du statut',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Réorganiser les catégories
     */
    public function reorder(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'categories' => 'required|array',
            'categories.*.id' => 'required|exists:categories,id',
            'categories.*.sort_order' => 'required|integer|min:0'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Erreurs de validation',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            foreach ($request->categories as $categoryData) {
                Category::where('id', $categoryData['id'])
                    ->update(['sort_order' => $categoryData['sort_order']]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Ordre des catégories mis à jour',
                'categories' => Category::ordered()->get()
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la réorganisation',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
