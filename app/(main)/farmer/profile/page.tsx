"use client";

import React, { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { FiEdit, FiMapPin, FiDroplet, FiSun, FiCalendar, FiX } from "react-icons/fi";
import { GiFarmTractor, GiWheat, GiPlantWatering } from "react-icons/gi";
import { Dialog } from "@headlessui/react";

interface FarmerData {
  id: string;
  clerkId: string;
  name: string;
  phone: string;
  email?: string;
  role: string;
  state: string;
  city: string;
  createdAt: Date;
  updatedAt: Date;
  farmerProfile?: {
    listings: Array<{
      cropType: string;
      status: string;
      createdAt: Date;
    }>;
    farmSize?: number;
    irrigationType?: string;
    soilType?: string;
    experience?: number;
  };
  totalContracts?: number;
  upcomingHarvest?: Date;
}

const Profile = () => {
  const { user } = useUser();
  const [farmerData, setFarmerData] = useState<FarmerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    city: "",
    state: "",
    phone: "",
    email: "",
    farmSize: 0,
    irrigationType: "",
    soilType: "",
    experience: 0,
  });

  useEffect(() => {
    const fetchFarmerData = async () => {
      try {
        const response = await fetch(`/api/farmer?userId=${user?.id}`);
        if (!response.ok) throw new Error('Failed to fetch data');
        
        const data = await response.json();
        setFarmerData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) fetchFarmerData();
  }, [user?.id]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/farmers/edit-profile/${user?.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          farmerProfile: {
            farmSize: Number(formData.farmSize),
            irrigationType: formData.irrigationType,
            soilType: formData.soilType,
            experience: Number(formData.experience),
          }
        }),
      });

      if (!response.ok) throw new Error('Update failed');
      
      const data = await response.json();
      setFarmerData(data);
      setIsEditModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    }
  };

  if (loading) return <div className="text-center p-8">Loading profile...</div>;
  if (error) return <div className="text-red-500 p-8">Error: {error}</div>;
  if (!farmerData) return <div className="p-8">No farmer profile found</div>;

  // Calculate derived data
  const activeListings = farmerData.farmerProfile?.listings?.filter(l => l.status === 'ACTIVE') || [];
  const completedListings = farmerData.farmerProfile?.listings?.filter(l => l.status === 'COMPLETED') || [];

  const stats = {
    farmSize: `${farmerData.farmerProfile?.farmSize || 0} acres`,
    experience: `${farmerData.farmerProfile?.experience || 0} years`,
    totalContracts: completedListings.length,
    upcomingHarvest: activeListings[0]?.createdAt
      ? new Date(activeListings[0].createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      : 'Not available',
  };

  const crops = Array.from(
    new Set(activeListings.map(l => l.cropType))
  );

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
       <Dialog open={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen">
          <div className="fixed inset-0 bg-black/30" />
          
          <div className="relative bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <Dialog.Title className="text-xl font-bold text-gray-800">Edit Profile</Dialog.Title>
              <button onClick={() => setIsEditModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                <FiX className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              {/* Form fields same as previous example */}
              {/* ... include all the form fields from the previous modal component ... */}
            </form>
          </div>
        </div>
      </Dialog>

      {/* Profile Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-green-800">Farmer Dashboard</h1>
        <button className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors">
          <FiEdit className="text-lg" />
          <span>Edit Profile</span>
        </button>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
        <div className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
            {/* Profile Image */}
            <div className="relative">
              <div className="w-32 h-32 bg-green-100 rounded-full flex items-center justify-center">
                <GiFarmTractor className="text-5xl text-green-600" />
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">{farmerData.name}</h2>
                  <div className="flex items-center gap-1 text-gray-600 mt-1">
                    <FiMapPin className="text-green-600" />
                    <span>{`${farmerData.city}, ${farmerData.state}`}</span>
                  </div>
                </div>
                <div className="mt-3 md:mt-0 bg-green-50 text-green-800 px-3 py-1 rounded-full text-sm">
                  Member since {new Date(farmerData.createdAt).toLocaleDateString()}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {Object.entries(stats).map(([key, value]) => (
                  <div key={key} className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-gray-500 text-sm capitalize">{key}</p>
                    <p className="font-semibold text-lg">{value}</p>
                  </div>
                ))}
              </div>

              {/* Contact */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-blue-800 font-medium">Contact Information</p>
                <p className="text-gray-700 mt-1">{farmerData.phone}</p>
                {farmerData.email && (
                  <p className="text-gray-700 mt-1">{farmerData.email}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Farm Details Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Crops Section */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6">
            <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2 mb-4">
              <GiWheat className="text-green-600" />
              <span>Active Crops</span>
            </h3>
            <div className="space-y-3">
              {crops.length > 0 ? (
                crops.map((crop, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <GiPlantWatering className="text-green-600 text-sm" />
                    </div>
                    <span className="font-medium">{crop}</span>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No active crops listed</p>
              )}
            </div>
          </div>
        </div>

        {/* Farm Characteristics */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6">
            <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2 mb-4">
              <FiSun className="text-yellow-500" />
              <span>Farm Details</span>
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <FiDroplet className="text-blue-600" />
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Irrigation Type</p>
                  <p className="font-medium">
                    {farmerData.farmerProfile?.irrigationType || 'Not specified'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                  <FiSun className="text-amber-600" />
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Soil Type</p>
                  <p className="font-medium">
                    {farmerData.farmerProfile?.soilType || 'Not specified'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
