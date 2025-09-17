<?php

namespace App\Http\Controllers;

use App\Models\CommissionSetting;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\Rule;

class CommissionController extends Controller
{
    /**
     * Afficher tous les paramètres de commission
     */
    public function index(): JsonResponse
    {
        $settings = CommissionSetting::active()->orderBy('key')->get();

        return response()->json([
            'settings' => $settings,
            'rates' => CommissionSetting::getAllRates()
        ]);
    }

    /**
     * Mettre à jour un taux de commission
     */
    public function update(Request $request, CommissionSetting $commissionSetting): JsonResponse
    {
        $validated = $request->validate([
            'value' => 'required|numeric|min:0|max:100',
            'description' => 'nullable|string|max:255',
            'is_active' => 'boolean',
        ]);

        try {
            $commissionSetting->update($validated);

            return response()->json([
                'message' => 'Taux de commission mis à jour avec succès',
                'setting' => $commissionSetting->fresh()
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la mise à jour du taux de commission',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Créer un nouveau paramètre de commission
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'key' => 'required|string|unique:commission_settings,key|max:100',
            'value' => 'required|numeric|min:0|max:100',
            'description' => 'nullable|string|max:255',
            'is_active' => 'boolean',
        ]);

        try {
            $setting = CommissionSetting::create($validated);

            return response()->json([
                'message' => 'Paramètre de commission créé avec succès',
                'setting' => $setting
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la création du paramètre de commission',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Supprimer un paramètre de commission
     */
    public function destroy(CommissionSetting $commissionSetting): JsonResponse
    {
        try {
            $commissionSetting->delete();

            return response()->json([
                'message' => 'Paramètre de commission supprimé avec succès'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la suppression du paramètre de commission',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Activer/désactiver un paramètre de commission
     */
    public function toggleStatus(CommissionSetting $commissionSetting): JsonResponse
    {
        try {
            if ($commissionSetting->is_active) {
                $commissionSetting->deactivate();
                $message = 'Paramètre de commission désactivé';
            } else {
                $commissionSetting->activate();
                $message = 'Paramètre de commission activé';
            }

            return response()->json([
                'message' => $message,
                'setting' => $commissionSetting->fresh()
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors du changement de statut',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Mettre à jour plusieurs taux en une fois
     */
    public function bulkUpdate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'rates' => 'required|array',
            'rates.*' => 'numeric|min:0|max:100',
        ]);

        try {
            $updated = [];

            foreach ($validated['rates'] as $key => $value) {
                if (CommissionSetting::updateRate($key, $value)) {
                    $updated[] = $key;
                }
            }

            return response()->json([
                'message' => 'Taux de commission mis à jour avec succès',
                'updated_keys' => $updated,
                'rates' => CommissionSetting::getAllRates()
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la mise à jour des taux de commission',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Calculer une commission prévisionnelle
     */
    public function calculatePreview(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:0.01',
            'type' => 'required|in:sound,event',
            'commission_rate' => 'nullable|numeric|min:0|max:100',
        ]);

        try {
            $amount = $validated['amount'];
            $type = $validated['type'];

            // Utiliser le taux personnalisé ou celui configuré
            $commissionRate = $validated['commission_rate'] ??
                             CommissionSetting::getRate($type . '_commission');

            $commissionAmount = ($amount * $commissionRate) / 100;
            $sellerAmount = $amount - $commissionAmount;

            return response()->json([
                'amount' => round($amount, 2),
                'commission_rate' => round($commissionRate, 2),
                'commission_amount' => round($commissionAmount, 2),
                'seller_amount' => round($sellerAmount, 2),
                'type' => $type,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors du calcul de la commission',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtenir l'historique des modifications de commission
     */
    public function history(): JsonResponse
    {
        // Cette fonctionnalité nécessiterait une table d'audit
        // Pour l'instant, on retourne les paramètres actuels avec leur date de modification
        $settings = CommissionSetting::orderBy('updated_at', 'desc')->get();

        return response()->json([
            'history' => $settings->map(function ($setting) {
                return [
                    'key' => $setting->key,
                    'display_name' => $setting->display_name,
                    'current_value' => $setting->value,
                    'formatted_value' => $setting->formatted_value,
                    'is_active' => $setting->is_active,
                    'last_updated' => $setting->updated_at->format('d/m/Y H:i'),
                ];
            })
        ]);
    }

    /**
     * Réinitialiser les taux par défaut
     */
    public function resetToDefaults(): JsonResponse
    {
        try {
            $defaults = [
                'sound_commission' => 15.00,
                'event_commission' => 10.00,
            ];

            $updated = [];
            foreach ($defaults as $key => $value) {
                if (CommissionSetting::updateRate($key, $value)) {
                    $updated[] = $key;
                }
            }

            return response()->json([
                'message' => 'Taux de commission réinitialisés aux valeurs par défaut',
                'updated_keys' => $updated,
                'rates' => CommissionSetting::getAllRates()
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la réinitialisation des taux',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
