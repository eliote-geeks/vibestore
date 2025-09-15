<?php

namespace App\Notifications;

use App\Models\Sound;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class SoundRejected extends Notification implements ShouldQueue
{
    use Queueable;

    protected $sound;
    protected $reason;

    /**
     * Create a new notification instance.
     */
    public function __construct(Sound $sound, string $reason)
    {
        $this->sound = $sound;
        $this->reason = $reason;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Votre son a été rejeté')
            ->greeting('Bonjour ' . $notifiable->name . ',')
            ->line('Nous vous informons que votre son "' . $this->sound->title . '" n\'a malheureusement pas pu être approuvé.')
            ->line('**Raison du rejet :** ' . $this->reason)
            ->line('Nous vous encourageons à corriger les problèmes mentionnés et à soumettre à nouveau votre son.')
            ->action('Modifier mon son', url('/edit-sound/' . $this->sound->id))
            ->line('Notre équipe reste à votre disposition pour vous accompagner.')
            ->line('Cordialement, l\'équipe Réveil Artist');
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'sound_rejected',
            'title' => 'Son rejeté',
            'message' => 'Votre son "' . $this->sound->title . '" a été rejeté. Raison : ' . $this->reason,
            'sound_id' => $this->sound->id,
            'sound_title' => $this->sound->title,
            'reason' => $this->reason,
            'action_url' => url('/edit-sound/' . $this->sound->id),
            'icon' => 'fas fa-times-circle',
            'color' => 'danger'
        ];
    }
}
