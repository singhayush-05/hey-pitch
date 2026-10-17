import mongoose from 'mongoose';

const verificationSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
      trim: true
    },
    host: {
      type: String,
      required: true,
      trim: true
    },
    provider: {
      type: String,
      required: true
    },
    isValidFormat: {
      type: Boolean,
      required: true
    },
    isDownloadable: {
      type: Boolean,
      default: false
    },
    accessStatus: {
      type: String,
      enum: [
        'valid_format',
        'download_accessible',
        'view_only',
        'unauthorized',
        'unsupported_provider',
        'ssrf_blocked',
        'provider_unconfigured',
        'error'
      ],
      default: 'valid_format'
    },
    sourceMetadata: {
      durationMinutes: { type: Number, default: null },
      sizeGb: { type: Number, default: null },
      format: { type: String, default: 'MP4' }
    },
    checkedAt: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: true
  }
);

export const Verification = mongoose.model('Verification', verificationSchema);
